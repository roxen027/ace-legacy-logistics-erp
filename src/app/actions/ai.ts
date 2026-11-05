"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import {
  parseRateConfirmation,
  verifyProofOfDelivery,
  parseEmailToQuote,
  rankFleetForDispatchLoad,
  analyzeDriverCheckCall,
  buildRoleCopilotBrief,
} from "@/lib/ai/service";
import { RateConParsedData, CopilotRoleBrief } from "@/lib/ai/types";

// ============================================================================
// MODULE 1: AI DOCUMENT INTELLIGENCE ACTIONS
// ============================================================================

export async function parseRateConTextAction(rawText: string, division: "BROKERAGE" | "DISPATCH" = "BROKERAGE") {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "SALES_MANAGER", "OPERATIONS_MANAGER", "DISPATCHER"].includes(user.role)) {
    throw new Error("Unauthorized permission to parse freight documents.");
  }

  if (!rawText || rawText.trim().length < 10) {
    throw new Error("Please provide valid document or rate confirmation text.");
  }

  const parsed = await parseRateConfirmation(rawText, division);

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "AI_PARSE_RATE_CON",
    entity: "Document",
    newValue: {
      broker: parsed.brokerName,
      rate: parsed.customerRate || parsed.grossFreightRate,
      lane: `${parsed.stops[0]?.city}, ${parsed.stops[0]?.state} -> ${parsed.stops[1]?.city}, ${parsed.stops[1]?.state}`,
    },
  });

  return { success: true, data: parsed };
}

export async function createLoadFromAiRateConAction(parsed: RateConParsedData) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "OPERATIONS_MANAGER", "DISPATCHER"].includes(user.role)) {
    throw new Error("Unauthorized to create loads from AI Rate Con.");
  }

  if (parsed.division === "BROKERAGE") {
    // 1. Find or create Customer
    let customer = await prisma.customer.findFirst({
      where: { name: { contains: parsed.brokerName } },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: parsed.brokerName,
          type: "SHIPPER",
          phone: parsed.brokerPhone || "+1 (800) 555-0199",
          email: "brokerage@loadsource.com",
          billingEmail: "ap@loadsource.com",
          paymentTerms: "NET_30",
          status: "ACTIVE",
          notes: "Auto-onboarded via AI Rate Confirmation ingestion.",
        },
      });
    }

    const count = await prisma.brokerageLoad.count();
    const loadNumber = `BL-2026-${(400 + count + 1).toString()}`;
    const customerRate = parsed.customerRate > 0 ? parsed.customerRate : 3200;
    const carrierRate = parsed.carrierRate > 0 ? parsed.carrierRate : Math.round(customerRate * 0.82);
    const grossMargin = customerRate - carrierRate;
    const marginPercent = Number(((grossMargin / customerRate) * 100).toFixed(1));

    const newLoad = await prisma.brokerageLoad.create({
      data: {
        loadNumber,
        customerId: customer.id,
        assignedOpsId: user.id,
        customerRefNo: parsed.brokerRefNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        equipment: parsed.equipment,
        commodity: parsed.commodity,
        weightLbs: parsed.weightLbs,
        palletCount: parsed.palletCount,
        totalMiles: parsed.totalMiles,
        customerRate,
        carrierRate,
        grossMargin,
        marginPercent,
        coverageStatus: "OPEN",
        executionStatus: "PENDING_DISPATCH",
        financialStatus: "UNBILLED",
        stops: {
          create: parsed.stops.map((s) => ({
            stopSequence: s.stopSequence,
            stopType: s.stopType,
            facilityName: s.facilityName,
            address: s.address,
            city: s.city,
            state: s.state,
            zip: s.zip,
            apptWindowStart: new Date(s.apptWindowStart),
            apptWindowEnd: new Date(s.apptWindowEnd),
            timezone: s.timezone,
            status: "PENDING",
            notes: s.notes,
          })),
        },
        events: {
          create: {
            eventType: "STATUS_CHANGE",
            location: `${parsed.stops[0]?.city}, ${parsed.stops[0]?.state}`,
            message: `Load auto-generated from AI Rate Con parsing. Ref: ${parsed.brokerRefNumber}.`,
            actorName: `${user.firstName} ${user.lastName} (AI Assistant)`,
          },
        },
      },
    });

    await logAuditEvent({
      userId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      action: "AI_CREATE_BROKERAGE_LOAD",
      entity: "BrokerageLoad",
      entityId: newLoad.id,
      newValue: { loadNumber: newLoad.loadNumber, customer: customer.name, rate: customerRate },
    });

    revalidatePath("/brokerage/loads");
    return { success: true, loadNumber: newLoad.loadNumber, division: "BROKERAGE" };
  } else {
    // 2. DISPATCH DIVISION LOAD
    let client = await prisma.dispatchClient.findFirst({
      where: { status: "ACTIVE" },
      include: { trucks: true },
    });

    if (!client || client.trucks.length === 0) {
      throw new Error("No active dispatch client with registered trucks found.");
    }

    const truck = client.trucks[0];
    const grossRate = parsed.grossFreightRate > 0 ? parsed.grossFreightRate : 2500;
    const feeRate = client.feeValue || 8.0;
    const calculatedFee = Number(((grossRate * feeRate) / 100).toFixed(2));

    const count = await prisma.dispatchLoad.count();
    const dispatchNumber = `DL-2026-${(200 + count + 1).toString()}`;

    const newDispatchLoad = await prisma.dispatchLoad.create({
      data: {
        dispatchNumber,
        clientId: client.id,
        truckId: truck.id,
        dispatcherId: user.id,
        brokerName: parsed.brokerName,
        brokerPhone: parsed.brokerPhone,
        brokerRefNumber: parsed.brokerRefNumber,
        originCity: parsed.stops[0]?.city || "Dallas",
        originState: parsed.stops[0]?.state || "TX",
        destCity: parsed.stops[1]?.city || "Chicago",
        destState: parsed.stops[1]?.state || "IL",
        loadedMiles: parsed.totalMiles,
        deadheadMiles: 30,
        grossFreightRate: grossRate,
        ratePerMile: parsed.totalMiles > 0 ? Number((grossRate / parsed.totalMiles).toFixed(2)) : 0,
        feeType: client.feeType,
        feeRate,
        calculatedFee,
        pickupDate: new Date(),
        deliveryDate: new Date(Date.now() + 24 * 3600 * 1000),
        status: "DISPATCHED",
        feeBilled: false,
        notes: `AI Parsed Rate Con from ${parsed.brokerName}.`,
      },
    });

    // Mark truck under load
    await prisma.truck.update({
      where: { id: truck.id },
      data: { status: "UNDER_LOAD", currentLocation: `${parsed.stops[0]?.city}, ${parsed.stops[0]?.state}` },
    });

    await logAuditEvent({
      userId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      action: "AI_CREATE_DISPATCH_LOAD",
      entity: "DispatchLoad",
      entityId: newDispatchLoad.id,
      newValue: { dispatchNumber: newDispatchLoad.dispatchNumber, fee: calculatedFee },
    });

    revalidatePath("/dispatch/loads");
    revalidatePath("/dispatch/fleet");
    return { success: true, loadNumber: newDispatchLoad.dispatchNumber, division: "DISPATCH" };
  }
}

export async function aiVerifyPodAnd3WayMatchAction(loadId: string, podText: string) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "OPERATIONS_MANAGER", "ACCOUNTING_MANAGER", "ACCOUNTANT"].includes(user.role)) {
    throw new Error("Unauthorized to perform AI POD verification.");
  }

  const load = await prisma.brokerageLoad.findUnique({
    where: { id: loadId },
    include: { customer: true, carrier: true, carrierPayables: true },
  });

  if (!load) throw new Error("Load not found");

  const verification = await verifyProofOfDelivery(podText, load.carrierRate);

  if (!verification.verificationPassed) {
    // Record Exception or Alert
    await prisma.loadException.create({
      data: {
        loadId: load.id,
        severity: verification.hasOsAndD ? "HIGH" : "MEDIUM",
        type: verification.hasOsAndD ? "CARGO_DAMAGE" : "MISSED_APPT",
        title: "AI POD Audit Exception",
        description: verification.auditSummary,
        status: "INVESTIGATING",
      },
    });

    await logAuditEvent({
      userId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      action: "AI_POD_AUDIT_EXCEPTION",
      entity: "BrokerageLoad",
      entityId: load.id,
      newValue: verification,
    });

    revalidatePath("/brokerage/loads");
    return { success: false, verification };
  }

  // --- 3-WAY MATCH SUCCESS: APPROVE & AUTO-INVOICE ---
  await prisma.$transaction(async (tx) => {
    // 1. Advance Load Status
    await tx.brokerageLoad.update({
      where: { id: load.id },
      data: {
        executionStatus: "POD_VERIFIED",
        financialStatus: "INVOICED",
        podDocumentUrl: `/uploads/pod/POD-${load.loadNumber}.pdf`,
        events: {
          create: {
            eventType: "STATUS_CHANGE",
            location: "Consignee Dock",
            message: `AI 3-Way Match Verified. Receiver signature confirmed. Rate confirmation matched exactly ($${load.carrierRate.toFixed(2)}).`,
            actorName: `${user.firstName} ${user.lastName} (AI Audit)`,
          },
        },
      },
    });

    // 2. Generate Shipper AR Invoice
    const invoiceCount = await tx.invoice.count();
    const invoiceNumber = `INV-2026-${(100 + invoiceCount + 1).toString()}`;
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
        notes: `AI-Verified Clean POD Invoice for ${load.loadNumber}. Ready for shipper remittance.`,
        lines: {
          create: [
            {
              description: `Freight Linehaul (${load.equipment.replace(/_/g, " ")}) - ${load.loadNumber}`,
              quantity: 1,
              unitPrice: load.customerRate,
              total: load.customerRate,
            },
          ],
        },
      },
    });

    // 3. Mark Carrier Payable as APPROVED_FOR_PAYMENT
    const existingPayable = load.carrierPayables[0];
    if (existingPayable) {
      await tx.carrierPayable.update({
        where: { id: existingPayable.id },
        data: { status: "APPROVED_FOR_PAYMENT" },
      });
    }
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "AI_POD_3WAY_MATCH_VERIFIED",
    entity: "BrokerageLoad",
    entityId: load.id,
    newValue: { status: "POD_VERIFIED", financialStatus: "INVOICED" },
  });

  revalidatePath("/brokerage/loads");
  revalidatePath("/accounting/receivables");
  revalidatePath("/accounting/payables");
  return { success: true, verification };
}

// ============================================================================
// MODULE 2: AI SMART QUOTE INTAKE & FLEET MATCHER ACTIONS
// ============================================================================

export async function aiEmailToQuoteAction(emailBody: string) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "SALES_MANAGER", "SALES_AGENT"].includes(user.role)) {
    throw new Error("Unauthorized to access AI Quote Intake.");
  }

  // Calculate historical RPM average from recent loads
  const recentLoads = await prisma.brokerageLoad.findMany({
    take: 10,
    select: { customerRate: true, totalMiles: true },
  });

  let avgRpm = 3.85;
  if (recentLoads.length > 0) {
    const totalRevenue = recentLoads.reduce((sum, l) => sum + l.customerRate, 0);
    const totalMiles = recentLoads.reduce((sum, l) => sum + l.totalMiles, 0);
    if (totalMiles > 0) avgRpm = totalRevenue / totalMiles;
  }

  const parsed = await parseEmailToQuote(emailBody, avgRpm);

  // Find or create Customer
  let customer = await prisma.customer.findFirst({
    where: { name: { contains: parsed.shipperCompanyName } },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: parsed.shipperCompanyName,
        type: "SHIPPER",
        email: parsed.contactEmail,
        phone: parsed.contactPhone,
        paymentTerms: "NET_30",
        creditLimit: 25000.0,
        status: "ACTIVE",
        notes: "Auto-onboarded via AI Email RFQ Intake.",
      },
    });
  }

  // Count existing quotes
  const count = await prisma.quote.count();
  const quoteNumber = `QT-2026-${(100 + count + 1).toString()}`;

  const quoteStatus = parsed.requiresManagerApproval ? "PENDING_INTERNAL_REVIEW" : "SUBMITTED";
  const internalApprovalStatus = parsed.requiresManagerApproval ? "PENDING" : "APPROVED";

  const newQuote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId: customer.id,
      createdById: user.id,
      currentVersion: 1,
      status: quoteStatus,
      internalApprovalStatus,
      approvalNotes: parsed.requiresManagerApproval ? parsed.approvalReason : "Auto-approved within margin policy.",
      originCity: parsed.originCity,
      originState: parsed.originState,
      destCity: parsed.destCity,
      destState: parsed.destState,
      equipment: parsed.equipment,
      totalMiles: parsed.totalMiles,
      versions: {
        create: {
          versionNumber: 1,
          customerRate: parsed.suggestedCustomerRate,
          carrierEstimatedCost: parsed.suggestedCarrierCost,
          estimatedMargin: parsed.projectedMargin,
          marginPercentage: parsed.projectedMarginPercent,
          validUntil: new Date(Date.now() + 14 * 24 * 3600 * 1000),
          customerDecision: "PENDING",
          notes: parsed.reasoning,
        },
      },
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "AI_CREATE_QUOTE_FROM_EMAIL",
    entity: "Quote",
    entityId: newQuote.id,
    newValue: {
      quoteNumber: newQuote.quoteNumber,
      margin: parsed.projectedMarginPercent,
      requiresApproval: parsed.requiresManagerApproval,
    },
  });

  revalidatePath("/sales/quotes");
  return { success: true, quoteNumber: newQuote.quoteNumber, parsed };
}

export async function aiRankFleetForLoadAction(loadData: {
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  loadedMiles: number;
  grossRate: number;
  trailerType: string;
}) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "OPERATIONS_MANAGER", "DISPATCHER"].includes(user.role)) {
    throw new Error("Unauthorized to access AI Fleet Matcher.");
  }

  const trucks = await prisma.truck.findMany({
    include: { client: true, drivers: true },
  });

  const ranked = rankFleetForDispatchLoad(loadData, trucks);

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "AI_RUN_FLEET_MATCHER",
    entity: "Truck",
    newValue: { lane: `${loadData.originCity} -> ${loadData.destCity}`, rankedCount: ranked.length },
  });

  return { success: true, ranked };
}

// ============================================================================
// MODULE 3: AUTOMATED AI CHECK-CALL & WEBHOOK ACTIONS
// ============================================================================

export async function triggerAiCheckCallAction(
  loadId: string,
  division: "BROKERAGE" | "DISPATCH",
  driverMessage?: string
) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "OPERATIONS_MANAGER", "DISPATCHER"].includes(user.role)) {
    throw new Error("Unauthorized to trigger AI Check-Calls.");
  }

  const sampleMessages = [
    "Hey this is Darius, just passed through Jackson, MS on I-20 E. Everything running smooth, ETA Atlanta around 4:30 PM.",
    "Dispatcher, I've arrived at the shipper in Dallas. Sitting at dock door 14 waiting for the loader. About 1 hour in now.",
    "Running into a big issue near Texarkana. Trailer had a blown tire on the right tandem. Pulled onto the shoulder waiting for roadside service.",
    "Still waiting at the consignee warehouse dock in Forest Park. It's been over 2.5 hours now with no forklift driver in sight. Please start detention clock.",
    "Freight is completely unloaded and clean. Receiver signed the BOL with zero damages. Leaving the dock empty now.",
  ];

  const transcript = driverMessage || sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

  if (division === "BROKERAGE") {
    const load = await prisma.brokerageLoad.findUnique({
      where: { id: loadId },
      include: { customer: true, carrier: true },
    });
    if (!load) throw new Error("Brokerage load not found");

    const analysis = analyzeDriverCheckCall(transcript, load.executionStatus);

    await prisma.$transaction(async (tx) => {
      // 1. Add Load Event
      await tx.loadEvent.create({
        data: {
          loadId: load.id,
          eventType: "CHECK_CALL",
          location: analysis.location,
          message: analysis.statusUpdate,
          actorName: "AI Outbound Voice Agent",
        },
      });

      // 2. Advance execution status if suggested
      if (analysis.recommendedExecutionStatus && analysis.recommendedExecutionStatus !== load.executionStatus) {
        await tx.brokerageLoad.update({
          where: { id: load.id },
          data: { executionStatus: analysis.recommendedExecutionStatus },
        });
      }

      // 3. Create urgent task if issue detected
      if (analysis.isIssueDetected) {
        await tx.task.create({
          data: {
            title: `[AI Alert] ${analysis.issueTitle || "Transit Exception"} - Load ${load.loadNumber}`,
            description: `${analysis.issueDescription}\nDriver Transcript: "${transcript}"`,
            priority: analysis.issueSeverity,
            assigneeId: user.id,
            createdById: user.id,
            status: "TODO",
            relatedType: "LOAD",
            relatedId: load.id,
          },
        });
      }
    });

    await logAuditEvent({
      userId: user.id,
      actorName: `${user.firstName} ${user.lastName} (AI Check-Call)`,
      action: "AI_VOICE_CHECK_CALL_PROCESSED",
      entity: "BrokerageLoad",
      entityId: load.id,
      newValue: analysis,
    });

    revalidatePath("/brokerage/loads");
    return { success: true, analysis };
  } else {
    // DISPATCH DIVISION
    const dLoad = await prisma.dispatchLoad.findUnique({
      where: { id: loadId },
      include: { client: true, truck: true },
    });
    if (!dLoad) throw new Error("Dispatch load not found");

    const analysis = analyzeDriverCheckCall(transcript, dLoad.status);

    await prisma.$transaction(async (tx) => {
      // 1. Log Check Call
      await tx.checkCall.create({
        data: {
          dispatchLoadId: dLoad.id,
          location: analysis.location,
          statusUpdate: analysis.statusUpdate,
          notes: transcript,
        },
      });

      // 2. Advance status
      if (analysis.recommendedExecutionStatus) {
        await tx.dispatchLoad.update({
          where: { id: dLoad.id },
          data: { status: analysis.recommendedExecutionStatus },
        });
      }

      // 3. Create task if issue detected
      if (analysis.isIssueDetected) {
        await tx.task.create({
          data: {
            title: `[AI Dispatch Alert] ${analysis.issueTitle || "Fleet Issue"} - Unit ${dLoad.truck.unitNumber}`,
            description: `${analysis.issueDescription}\nDriver: "${transcript}"`,
            priority: analysis.issueSeverity,
            assigneeId: user.id,
            createdById: user.id,
            status: "TODO",
            relatedType: "LOAD",
            relatedId: dLoad.id,
          },
        });
      }
    });

    await logAuditEvent({
      userId: user.id,
      actorName: `${user.firstName} ${user.lastName} (AI Check-Call)`,
      action: "AI_DISPATCH_CHECK_CALL_PROCESSED",
      entity: "DispatchLoad",
      entityId: dLoad.id,
      newValue: analysis,
    });

    revalidatePath("/dispatch/loads");
    return { success: true, analysis };
  }
}

// ============================================================================
// MODULE 4: ROLE-AWARE ERP AI COMMAND COPILOT ACTIONS
// ============================================================================

export async function getCopilotBriefAction(): Promise<CopilotRoleBrief> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized to access AI Copilot.");
  }

  const [
    unbilledLoads,
    pendingQuotes,
    uncoveredLoads,
    activeCarriers,
    expiringCois,
    activeTrucks,
    availableTrucks,
    weeklyStatementsDue,
    pendingLeaves,
    todayAttendance,
    brokerageLoads,
    dispatchInvoices,
  ] = await Promise.all([
    prisma.brokerageLoad.findMany({
      where: { executionStatus: "DELIVERED", financialStatus: "UNBILLED" },
      select: { customerRate: true },
    }),
    prisma.quote.count({
      where: { internalApprovalStatus: "PENDING" },
    }),
    prisma.brokerageLoad.count({
      where: { coverageStatus: "OPEN" },
    }),
    prisma.carrier.count({
      where: { status: "ACTIVE" },
    }),
    prisma.carrier.count({
      where: { coiOnFile: true, insuranceCargoExpiry: { lte: new Date(Date.now() + 30 * 24 * 3600 * 1000) } },
    }),
    prisma.truck.count({
      where: { status: "UNDER_LOAD" },
    }),
    prisma.truck.count({
      where: { status: "AVAILABLE" },
    }),
    prisma.dispatchLoad.count({
      where: { feeBilled: false, status: { in: ["DELIVERED", "POD_COLLECTED"] } },
    }),
    prisma.leaveRequest.count({
      where: { status: "PENDING" },
    }),
    prisma.attendance.count({
      where: {
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: "LATE",
      },
    }),
    prisma.brokerageLoad.findMany({
      select: { grossMargin: true },
    }),
    prisma.invoice.findMany({
      where: { division: "DISPATCH" },
      select: { totalAmount: true },
    }),
  ]);

  const unbilledTotal = unbilledLoads.reduce((sum, l) => sum + l.customerRate, 0);
  const grossBrokerageMargin = brokerageLoads.reduce((sum, l) => sum + l.grossMargin, 0);
  const dispatchFeeRevenue = dispatchInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const metrics = {
    unbilledLoadsCount: unbilledLoads.length,
    unbilledTotal,
    pendingQuotesCount: pendingQuotes,
    uncoveredLoadsCount: uncoveredLoads,
    activeCarriersCount: activeCarriers,
    expiringCoiCount: expiringCois,
    activeTrucksCount: activeTrucks,
    availableTrucksCount: availableTrucks,
    weeklyStatementsDueCount: weeklyStatementsDue,
    pendingLeavesCount: pendingLeaves,
    todayLatePunchCount: todayAttendance,
    grossBrokerageMargin,
    dispatchFeeRevenue,
  };

  return buildRoleCopilotBrief(user.role, `${user.firstName} ${user.lastName}`, metrics);
}
