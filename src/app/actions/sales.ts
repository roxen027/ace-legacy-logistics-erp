"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createCustomerAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const type = (formData.get("type") as string) || "SHIPPER";
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zip = formData.get("zip") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const creditLimit = parseFloat(formData.get("creditLimit") as string || "25000");
  const paymentTerms = formData.get("paymentTerms") as string || "NET_30";
  const notes = formData.get("notes") as string;

  const customer = await prisma.customer.create({
    data: {
      name,
      type,
      address,
      city,
      state,
      zip,
      phone,
      email,
      creditLimit,
      paymentTerms,
      notes,
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "CREATE",
    entity: "Customer",
    entityId: customer.id,
    newValue: { name, creditLimit, paymentTerms },
  });

  revalidatePath("/sales/leads");
  return { success: true, customerId: customer.id };
}

export async function createLeadAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const companyName = formData.get("companyName") as string;
  const contactName = formData.get("contactName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const source = formData.get("source") as string || "COLD_CALL";
  const estimatedValue = parseFloat(formData.get("estimatedValue") as string || "0");
  const notes = formData.get("notes") as string;
  const salesAgentId = (formData.get("salesAgentId") as string) || user.id;

  const count = await prisma.lead.count();
  const leadNumber = `LEAD-2026-${(100 + count + 1).toString()}`;

  const lead = await prisma.lead.create({
    data: {
      leadNumber,
      companyName,
      contactName,
      email,
      phone,
      source,
      estimatedValue,
      notes,
      salesAgentId,
      status: "NEW",
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "CREATE",
    entity: "Lead",
    entityId: lead.id,
    newValue: { leadNumber, companyName, salesAgentId },
  });

  revalidatePath("/sales/leads");
  return { success: true };
}

export async function createQuoteAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const customerId = formData.get("customerId") as string;
  const originCity = formData.get("originCity") as string;
  const originState = formData.get("originState") as string;
  const destCity = formData.get("destCity") as string;
  const destState = formData.get("destState") as string;
  const equipment = formData.get("equipment") as string || "DRY_VAN";
  const totalMiles = parseFloat(formData.get("totalMiles") as string || "0");
  
  const customerRate = parseFloat(formData.get("customerRate") as string || "0");
  const carrierEstimatedCost = parseFloat(formData.get("carrierEstimatedCost") as string || "0");
  const estimatedMargin = customerRate - carrierEstimatedCost;
  const marginPercentage = customerRate > 0 ? (estimatedMargin / customerRate) * 100 : 0;
  
  // Mandatory Business Rule: If margin is under 12% or negative, internal manager review is required
  const requiresInternalReview = marginPercentage < 12.0 || estimatedMargin <= 0;
  const internalApprovalStatus = requiresInternalReview ? "PENDING" : "APPROVED";
  const quoteStatus = requiresInternalReview ? "PENDING_INTERNAL_REVIEW" : "SUBMITTED";

  const count = await prisma.quote.count();
  const quoteNumber = `QT-2026-${(100 + count + 1).toString()}`;

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId,
      createdById: user.id,
      currentVersion: 1,
      status: quoteStatus,
      internalApprovalStatus,
      originCity,
      originState,
      destCity,
      destState,
      equipment,
      totalMiles,
      versions: {
        create: {
          versionNumber: 1,
          customerRate,
          carrierEstimatedCost,
          estimatedMargin,
          marginPercentage: Number(marginPercentage.toFixed(2)),
          validUntil: new Date(Date.now() + 14 * 24 * 3600 * 1000), // 14 days
          customerDecision: "PENDING",
        },
      },
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "CREATE_QUOTE",
    entity: "Quote",
    entityId: quote.id,
    newValue: { quoteNumber, customerRate, marginPercentage, status: quoteStatus },
  });

  revalidatePath("/sales/quotes");
  return { success: true };
}

export async function reviseQuoteAction(quoteId: string, customerRate: number, carrierEstimatedCost: number, notes?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { versions: true },
  });
  if (!quote) throw new Error("Quote not found");

  const nextVersionNumber = quote.currentVersion + 1;
  const estimatedMargin = customerRate - carrierEstimatedCost;
  const marginPercentage = customerRate > 0 ? (estimatedMargin / customerRate) * 100 : 0;
  const requiresInternalReview = marginPercentage < 12.0;

  await prisma.$transaction([
    prisma.quoteVersion.create({
      data: {
        quoteId: quote.id,
        versionNumber: nextVersionNumber,
        customerRate,
        carrierEstimatedCost,
        estimatedMargin,
        marginPercentage: Number(marginPercentage.toFixed(2)),
        validUntil: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        customerDecision: "PENDING",
        notes,
      },
    }),
    prisma.quote.update({
      where: { id: quote.id },
      data: {
        currentVersion: nextVersionNumber,
        status: requiresInternalReview ? "PENDING_INTERNAL_REVIEW" : "SUBMITTED",
        internalApprovalStatus: requiresInternalReview ? "PENDING" : "APPROVED",
      },
    }),
  ]);

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "REVISE_QUOTE",
    entity: "Quote",
    entityId: quote.id,
    newValue: { version: nextVersionNumber, customerRate, marginPercentage },
  });

  revalidatePath("/sales/quotes");
  return { success: true };
}

export async function approveQuoteAction(quoteId: string, notes?: string) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "SALES_MANAGER"].includes(user.role)) {
    throw new Error("Unauthorized to approve quotes.");
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      internalApprovalStatus: "APPROVED",
      status: "SUBMITTED",
      approvedBy: `${user.firstName} ${user.lastName}`,
      approvalNotes: notes || "Manager approved rate structure.",
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "APPROVE_QUOTE",
    entity: "Quote",
    entityId: quoteId,
  });

  revalidatePath("/sales/quotes");
  return { success: true };
}

export async function recordCustomerDecisionAction(
  quoteId: string,
  decision: "ACCEPTED" | "REJECTED" | "COUNTER_OFFER",
  counterAmount?: number,
  notes?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  if (!quote) throw new Error("Quote not found");

  const currentVer = quote.versions[0];
  if (currentVer) {
    await prisma.quoteVersion.update({
      where: { id: currentVer.id },
      data: {
        customerDecision: decision,
        decisionDate: new Date(),
        counterOfferAmount: counterAmount || null,
        notes: notes || currentVer.notes,
      },
    });
  }

  const quoteStatus =
    decision === "ACCEPTED" ? "CUSTOMER_ACCEPTED" : decision === "REJECTED" ? "CUSTOMER_REJECTED" : "DRAFT";

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: quoteStatus },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "RECORD_CUSTOMER_DECISION",
    entity: "Quote",
    entityId: quoteId,
    newValue: { decision, counterAmount },
  });

  revalidatePath("/sales/quotes");
  return { success: true };
}

export async function convertQuoteToLoadAction(quoteId: string) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "SALES_MANAGER", "OPERATIONS_MANAGER"].includes(user.role)) {
    throw new Error("Unauthorized to convert quotes to brokerage loads.");
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      customer: true,
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });

  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "CUSTOMER_ACCEPTED") {
    throw new Error("Only customer-accepted quotes can be converted into a brokerage load.");
  }
  if (quote.convertedLoadId) {
    throw new Error("This quote has already been converted into a brokerage load.");
  }

  const latestVersion = quote.versions[0];
  const count = await prisma.brokerageLoad.count();
  const loadNumber = `BL-2026-${(400 + count + 1).toString()}`;

  // Create Load and Stops transactionally
  const load = await prisma.$transaction(async (tx) => {
    const newLoad = await tx.brokerageLoad.create({
      data: {
        loadNumber,
        quoteId: quote.id,
        customerId: quote.customerId,
        equipment: quote.equipment,
        totalMiles: quote.totalMiles,
        customerRate: latestVersion.customerRate,
        carrierRate: latestVersion.carrierEstimatedCost,
        grossMargin: latestVersion.estimatedMargin,
        marginPercent: latestVersion.marginPercentage,
        coverageStatus: "OPEN",
        executionStatus: "PENDING_DISPATCH",
        financialStatus: "UNBILLED",
        stops: {
          create: [
            {
              stopSequence: 1,
              stopType: "PICKUP",
              facilityName: `${quote.customer.name} Shipping Dock`,
              address: "100 Shipper Way",
              city: quote.originCity,
              state: quote.originState,
              zip: "75001",
              apptWindowStart: new Date(Date.now() + 24 * 3600 * 1000),
              apptWindowEnd: new Date(Date.now() + 28 * 3600 * 1000),
              timezone: "America/Chicago",
              status: "PENDING",
            },
            {
              stopSequence: 2,
              stopType: "DELIVERY",
              facilityName: "Consignee Receiving Facility",
              address: "500 Logistics Park",
              city: quote.destCity,
              state: quote.destState,
              zip: "30301",
              apptWindowStart: new Date(Date.now() + 48 * 3600 * 1000),
              apptWindowEnd: new Date(Date.now() + 52 * 3600 * 1000),
              timezone: "America/New_York",
              status: "PENDING",
            },
          ],
        },
      },
    });

    await tx.quote.update({
      where: { id: quote.id },
      data: {
        convertedLoadId: newLoad.id,
        status: "CONVERTED",
      },
    });

    return newLoad;
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "CONVERT_QUOTE_TO_LOAD",
    entity: "BrokerageLoad",
    entityId: load.id,
    newValue: { loadNumber: load.loadNumber, fromQuote: quote.quoteNumber },
  });

  revalidatePath("/sales/quotes");
  revalidatePath("/brokerage/loads");
  return { success: true, loadNumber: load.loadNumber };
}
