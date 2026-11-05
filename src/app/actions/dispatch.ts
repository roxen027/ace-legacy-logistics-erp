"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createDispatchClientAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const companyName = formData.get("companyName") as string;
  const ownerName = formData.get("ownerName") as string;
  const mcNumber = formData.get("mcNumber") as string;
  const dotNumber = formData.get("dotNumber") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const feeType = (formData.get("feeType") as string) || "PERCENTAGE";
  const feeValue = parseFloat(formData.get("feeValue") as string || "8.0");
  const notes = formData.get("notes") as string;

  const count = await prisma.dispatchClient.count();
  const clientCode = `DC-${(100 + count + 1).toString()}`;

  const client = await prisma.dispatchClient.create({
    data: {
      clientCode,
      companyName,
      ownerName,
      mcNumber,
      dotNumber,
      phone,
      email,
      feeType,
      feeValue,
      contractStart: new Date(),
      status: "ACTIVE",
      notes,
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "ONBOARD_DISPATCH_CLIENT",
    entity: "DispatchClient",
    entityId: client.id,
    newValue: { clientCode, companyName, feeType, feeValue },
  });

  revalidatePath("/dispatch/clients");
  return { success: true };
}

export async function createTruckAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const clientId = formData.get("clientId") as string;
  const unitNumber = formData.get("unitNumber") as string;
  const vin = formData.get("vin") as string;
  const trailerType = formData.get("trailerType") as string || "DRY_VAN";
  const trailerNumber = formData.get("trailerNumber") as string;
  const homeBaseCity = formData.get("homeBaseCity") as string;
  const homeBaseState = formData.get("homeBaseState") as string;
  const minRatePerMile = parseFloat(formData.get("minRatePerMile") as string || "2.20");
  const preferredLanes = formData.get("preferredLanes") as string;

  const truck = await prisma.truck.create({
    data: {
      clientId,
      unitNumber,
      vin,
      trailerType,
      trailerNumber,
      homeBaseCity,
      homeBaseState,
      minRatePerMile,
      preferredLanes,
      status: "AVAILABLE",
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "ADD_TRUCK",
    entity: "Truck",
    entityId: truck.id,
    newValue: { unitNumber, trailerType, clientId },
  });

  revalidatePath("/dispatch/fleet");
  return { success: true };
}

export async function createDispatchLoadAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const clientId = formData.get("clientId") as string;
  const truckId = formData.get("truckId") as string;
  const brokerName = formData.get("brokerName") as string;
  const brokerPhone = formData.get("brokerPhone") as string;
  const brokerRefNumber = formData.get("brokerRefNumber") as string;
  const originCity = formData.get("originCity") as string;
  const originState = formData.get("originState") as string;
  const destCity = formData.get("destCity") as string;
  const destState = formData.get("destState") as string;
  const loadedMiles = parseFloat(formData.get("loadedMiles") as string || "0");
  const deadheadMiles = parseFloat(formData.get("deadheadMiles") as string || "0");
  const grossFreightRate = parseFloat(formData.get("grossFreightRate") as string || "0");

  const client = await prisma.dispatchClient.findUnique({
    where: { id: clientId },
  });
  if (!client) throw new Error("Dispatch client not found");

  const feeRate = client.feeValue;
  const calculatedFee =
    client.feeType === "PERCENTAGE"
      ? Number(((grossFreightRate * feeRate) / 100).toFixed(2))
      : feeRate;

  const count = await prisma.dispatchLoad.count();
  const dispatchNumber = `DL-2026-${(200 + count + 1).toString()}`;

  const dispatchLoad = await prisma.dispatchLoad.create({
    data: {
      dispatchNumber,
      clientId,
      truckId,
      dispatcherId: user.id,
      brokerName,
      brokerPhone,
      brokerRefNumber,
      originCity,
      originState,
      destCity,
      destState,
      loadedMiles,
      deadheadMiles,
      grossFreightRate,
      ratePerMile: loadedMiles > 0 ? Number((grossFreightRate / loadedMiles).toFixed(2)) : 0,
      feeType: client.feeType,
      feeRate,
      calculatedFee,
      pickupDate: new Date(),
      deliveryDate: new Date(Date.now() + 24 * 3600 * 1000),
      status: "DISPATCHED",
      feeBilled: false,
    },
  });

  // Update truck status to UNDER_LOAD
  await prisma.truck.update({
    where: { id: truckId },
    data: { status: "UNDER_LOAD", currentLocation: `${originCity}, ${originState}` },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "BOOK_DISPATCH_LOAD",
    entity: "DispatchLoad",
    entityId: dispatchLoad.id,
    newValue: { dispatchNumber, grossFreightRate, calculatedFee, brokerName },
  });

  revalidatePath("/dispatch/loads");
  revalidatePath("/dispatch/fleet");
  revalidatePath("/");
  return { success: true };
}

export async function billDispatchFeeAction(dispatchLoadId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const load = await prisma.dispatchLoad.findUnique({
    where: { id: dispatchLoadId },
    include: { client: true, truck: true },
  });
  if (!load) throw new Error("Dispatch load not found");

  if (load.feeBilled) {
    throw new Error("This load's dispatch fee has already been billed.");
  }

  const count = await prisma.invoice.count({ where: { division: "DISPATCH" } });
  const invoiceNumber = `STMT-2026-${(10 + count + 1).toString().padStart(4, "0")}`;

  await prisma.$transaction(async (tx) => {
    // 1. Create client fee invoice/statement
    await tx.invoice.create({
      data: {
        invoiceNumber,
        division: "DISPATCH",
        dispatchClientId: load.clientId,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000), // Net 7
        subtotal: load.calculatedFee,
        totalAmount: load.calculatedFee,
        balanceDue: load.calculatedFee,
        status: "SENT",
        notes: `Dispatch fee statement for load ${load.dispatchNumber} (${load.originCity} to ${load.destCity}).`,
        lines: {
          create: [
            {
              description: `Dispatch Service Fee (${load.feeRate}%) - Load ${load.dispatchNumber}`,
              quantity: 1,
              unitPrice: load.calculatedFee,
              total: load.calculatedFee,
            },
          ],
        },
      },
    });

    // 2. Mark load as fee billed
    await tx.dispatchLoad.update({
      where: { id: load.id },
      data: { feeBilled: true, status: "BILLED" },
    });

    // 3. Mark truck available again
    await tx.truck.update({
      where: { id: load.truckId },
      data: { status: "AVAILABLE", currentLocation: `${load.destCity}, ${load.destState}` },
    });
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "BILL_DISPATCH_FEE",
    entity: "Invoice",
    newValue: { invoiceNumber, client: load.client.companyName, fee: load.calculatedFee },
  });

  revalidatePath("/dispatch/loads");
  revalidatePath("/accounting/dispatch-fees");
  revalidatePath("/");
  return { success: true };
}
