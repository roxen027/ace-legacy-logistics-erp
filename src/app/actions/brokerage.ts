"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createCarrierAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const legalName = formData.get("legalName") as string;
  const dba = formData.get("dba") as string;
  const mcNumber = formData.get("mcNumber") as string;
  const dotNumber = formData.get("dotNumber") as string;
  const phone = formData.get("phone") as string;
  const dispatchEmail = formData.get("dispatchEmail") as string;
  const accountingEmail = formData.get("accountingEmail") as string;
  const paymentTerms = (formData.get("paymentTerms") as string) || "NET_30";
  const insuranceCargoAmount = parseFloat(formData.get("insuranceCargoAmount") as string || "100000");
  const insuranceAutoAmount = parseFloat(formData.get("insuranceAutoAmount") as string || "1000000");
  const notes = formData.get("notes") as string;

  const carrier = await prisma.carrier.create({
    data: {
      legalName,
      dba,
      mcNumber,
      dotNumber,
      phone,
      dispatchEmail,
      accountingEmail,
      paymentTerms,
      insuranceCargoAmount,
      insuranceAutoAmount,
      status: "ACTIVE",
      safetyScore: "SATISFACTORY",
      w9OnFile: true,
      coiOnFile: true,
      agreementOnFile: true,
      verifiedAt: new Date(),
      verifiedBy: `${user.firstName} ${user.lastName}`,
      notes,
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "ONBOARD_CARRIER",
    entity: "Carrier",
    entityId: carrier.id,
    newValue: { mcNumber, legalName, status: "ACTIVE" },
  });

  revalidatePath("/brokerage/carriers");
  return { success: true, carrierId: carrier.id };
}

export async function assignCarrierToLoadAction(
  loadId: string,
  carrierId: string,
  carrierRate: number,
  driverName?: string,
  driverPhone?: string,
  truckNumber?: string,
  trailerNumber?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const load = await prisma.brokerageLoad.findUnique({
    where: { id: loadId },
  });
  if (!load) throw new Error("Load not found");

  const carrier = await prisma.carrier.findUnique({
    where: { id: carrierId },
  });
  if (!carrier) throw new Error("Carrier not found");

  if (carrier.status !== "ACTIVE") {
    throw new Error(`Carrier ${carrier.legalName} is not active for dispatch.`);
  }

  const grossMargin = load.customerRate - carrierRate;
  const marginPercent = load.customerRate > 0 ? (grossMargin / load.customerRate) * 100 : 0;

  const updatedLoad = await prisma.brokerageLoad.update({
    where: { id: loadId },
    data: {
      carrierId,
      carrierRate,
      grossMargin,
      marginPercent: Number(marginPercent.toFixed(2)),
      coverageStatus: "COVERED",
      executionStatus: "DISPATCHED",
      driverName,
      driverPhone,
      truckNumber,
      trailerNumber,
      rateConSignedUrl: `/uploads/rate_cons/RC-${load.loadNumber}.pdf`,
      events: {
        create: {
          eventType: "STATUS_CHANGE",
          message: `Carrier ${carrier.legalName} (MC-${carrier.mcNumber}) assigned at $${carrierRate.toFixed(2)}. Rate Confirmation generated.`,
          actorName: `${user.firstName} ${user.lastName}`,
        },
      },
    },
  });

  // Create carrier payable record automatically for 3-way match
  const count = await prisma.carrierPayable.count();
  const payableNumber = `AP-2026-${(400 + count + 1).toString()}`;
  await prisma.carrierPayable.create({
    data: {
      payableNumber,
      loadId: load.id,
      carrierId: carrier.id,
      carrierInvoiceNo: `INV-${carrier.mcNumber}-${load.loadNumber}`,
      amountAgreed: carrierRate,
      totalDue: carrierRate,
      balanceDue: carrierRate,
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), // Net 30
      status: "PENDING_AUDIT",
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "ASSIGN_CARRIER",
    entity: "BrokerageLoad",
    entityId: loadId,
    newValue: { carrier: carrier.legalName, carrierRate, grossMargin },
  });

  revalidatePath("/brokerage/loads");
  revalidatePath("/accounting/payables");
  return { success: true };
}

export async function updateLoadMilestoneAction(
  loadId: string,
  newExecutionStatus: string,
  location?: string,
  notes?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const load = await prisma.brokerageLoad.findUnique({
    where: { id: loadId },
    include: { stops: true },
  });
  if (!load) throw new Error("Load not found");

  await prisma.brokerageLoad.update({
    where: { id: loadId },
    data: {
      executionStatus: newExecutionStatus,
      events: {
        create: {
          eventType: "CHECK_CALL",
          location: location || "En Route",
          message: `Milestone advanced to ${newExecutionStatus.replace(/_/g, " ")}. ${notes || ""}`,
          actorName: `${user.firstName} ${user.lastName}`,
        },
      },
    },
  });

  // If status is DELIVERED, automatically update delivery stop actualArrival
  if (newExecutionStatus === "DELIVERED") {
    const deliveryStop = load.stops.find((s) => s.stopType === "DELIVERY");
    if (deliveryStop) {
      await prisma.loadStop.update({
        where: { id: deliveryStop.id },
        data: { status: "COMPLETED", actualArrival: new Date() },
      });
    }
  }

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "UPDATE_LOAD_STATUS",
    entity: "BrokerageLoad",
    entityId: loadId,
    oldValue: { status: load.executionStatus },
    newValue: { status: newExecutionStatus, location },
  });

  revalidatePath("/brokerage/loads");
  revalidatePath("/");
  return { success: true };
}

export async function verifyPodDocumentAction(loadId: string, notes?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const load = await prisma.brokerageLoad.findUnique({
    where: { id: loadId },
    include: { customer: true },
  });
  if (!load) throw new Error("Load not found");

  await prisma.$transaction(async (tx) => {
    // 1. Update load execution status to POD_VERIFIED
    await tx.brokerageLoad.update({
      where: { id: loadId },
      data: {
        executionStatus: "POD_VERIFIED",
        podDocumentUrl: `/uploads/pod/POD-${load.loadNumber}.pdf`,
        financialStatus: "INVOICED",
        events: {
          create: {
            eventType: "STATUS_CHANGE",
            message: `Proof of Delivery (POD) signed and verified. Load ready for customer billing.`,
            actorName: `${user.firstName} ${user.lastName}`,
          },
        },
      },
    });

    // 2. Automatically generate Shipper Invoice (AR)
    const count = await tx.invoice.count();
    const invoiceNumber = `INV-2026-${(100 + count + 1).toString()}`;
    await tx.invoice.create({
      data: {
        invoiceNumber,
        division: "BROKERAGE",
        customerId: load.customerId,
        brokerageLoadId: load.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), // Net 30
        subtotal: load.customerRate,
        accessorialTotal: load.accessorialCustomer,
        totalAmount: load.customerRate + load.accessorialCustomer,
        balanceDue: load.customerRate + load.accessorialCustomer,
        status: "SENT",
        notes: `Freight invoice for ${load.loadNumber} delivered with clean signed POD.`,
        lines: {
          create: [
            {
              description: `Freight linehaul (${load.equipment.replace(/_/g, " ")}) - ${load.loadNumber}`,
              quantity: 1,
              unitPrice: load.customerRate,
              total: load.customerRate,
            },
          ],
        },
      },
    });
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "VERIFY_POD_AND_INVOICE",
    entity: "BrokerageLoad",
    entityId: loadId,
  });

  revalidatePath("/brokerage/loads");
  revalidatePath("/accounting/receivables");
  return { success: true };
}
