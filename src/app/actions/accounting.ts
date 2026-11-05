"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function recordCustomerPaymentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ACCOUNTING_MANAGER", "ACCOUNTANT"].includes(user.role)) {
    throw new Error("Unauthorized to record customer payments.");
  }

  const invoiceId = formData.get("invoiceId") as string;
  const paymentAmount = parseFloat(formData.get("amount") as string || "0");
  const paymentMethod = (formData.get("paymentMethod") as string) || "ACH";
  const referenceNumber = formData.get("referenceNumber") as string;
  const notes = formData.get("notes") as string;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true, dispatchClient: true, brokerageLoad: true },
  });
  if (!invoice) throw new Error("Invoice not found");

  const newAmountPaid = invoice.amountPaid + paymentAmount;
  const newBalanceDue = Math.max(0, invoice.totalAmount - newAmountPaid);
  const newStatus = newBalanceDue === 0 ? "PAID_IN_FULL" : "PARTIALLY_PAID";

  const count = await prisma.payment.count();
  const paymentNumber = `PMT-2026-${(100 + count + 1).toString()}`;

  await prisma.$transaction(async (tx) => {
    // 1. Create Payment Record
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        division: invoice.division,
        paymentMethod,
        referenceNumber,
        amount: paymentAmount,
        receivedFrom: invoice.customer?.name || invoice.dispatchClient?.companyName || "Client",
        notes,
        allocations: {
          create: {
            invoiceId: invoice.id,
            amount: paymentAmount,
          },
        },
      },
    });

    // 2. Update Invoice Status & Balances
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: newStatus,
      },
    });

    // 3. If brokerage load paid in full, update load financial status
    if (invoice.brokerageLoadId && newStatus === "PAID_IN_FULL") {
      await tx.brokerageLoad.update({
        where: { id: invoice.brokerageLoadId },
        data: { financialStatus: "PAID_IN_FULL" },
      });
    }
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "RECORD_PAYMENT",
    entity: "Payment",
    entityId: invoiceId,
    newValue: { paymentNumber, amount: paymentAmount, referenceNumber, invoiceStatus: newStatus },
  });

  revalidatePath("/accounting/receivables");
  revalidatePath("/accounting/dispatch-fees");
  revalidatePath("/");
  return { success: true };
}

export async function approveCarrierPayableAction(payableId: string) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ACCOUNTING_MANAGER"].includes(user.role)) {
    throw new Error("Unauthorized to approve carrier disbursements.");
  }

  await prisma.carrierPayable.update({
    where: { id: payableId },
    data: { status: "APPROVED_FOR_PAYMENT" },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "APPROVE_CARRIER_PAYABLE",
    entity: "CarrierPayable",
    entityId: payableId,
  });

  revalidatePath("/accounting/payables");
  return { success: true };
}

export async function disburseCarrierPaymentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ACCOUNTING_MANAGER", "ACCOUNTANT"].includes(user.role)) {
    throw new Error("Unauthorized to disburse carrier payments.");
  }

  const payableId = formData.get("payableId") as string;
  const paymentMethod = formData.get("paymentMethod") as string || "ACH";
  const paymentReference = formData.get("paymentReference") as string;

  const payable = await prisma.carrierPayable.findUnique({
    where: { id: payableId },
  });
  if (!payable) throw new Error("Payable record not found");

  await prisma.carrierPayable.update({
    where: { id: payableId },
    data: {
      amountPaid: payable.totalDue,
      balanceDue: 0.0,
      status: "PAID",
      paymentDate: new Date(),
      paymentMethod,
      paymentReference,
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "DISBURSE_CARRIER_PAYMENT",
    entity: "CarrierPayable",
    entityId: payableId,
    newValue: { amountPaid: payable.totalDue, paymentReference },
  });

  revalidatePath("/accounting/payables");
  return { success: true };
}

export async function approveCommissionAction(commissionId: string) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ACCOUNTING_MANAGER", "SALES_MANAGER"].includes(user.role)) {
    throw new Error("Unauthorized to approve commissions.");
  }

  await prisma.commission.update({
    where: { id: commissionId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "APPROVE_COMMISSION",
    entity: "Commission",
    entityId: commissionId,
  });

  revalidatePath("/accounting/commissions");
  return { success: true };
}
