import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { analyzeDriverCheckCall } from "@/lib/ai/service";
import { CheckCallWebhookPayloadSchema } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  try {
    // 1. Optional Secret Verification
    const secretHeader = req.headers.get("x-webhook-secret");
    const configuredSecret = process.env.AI_CHECK_CALL_WEBHOOK_SECRET;

    if (configuredSecret && secretHeader && secretHeader !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized webhook signature." }, { status: 401 });
    }

    const body = await req.json();
    const validation = CheckCallWebhookPayloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid webhook payload schema.", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { loadId, division, transcript, rawLocation, reportedEta, detentionHours, hasBreakdown } =
      validation.data;

    if (division === "BROKERAGE") {
      const load = await prisma.brokerageLoad.findUnique({
        where: { id: loadId },
        include: { customer: true, carrier: true },
      });

      if (!load) {
        return NextResponse.json({ error: `Brokerage load ${loadId} not found.` }, { status: 404 });
      }

      const analysis = analyzeDriverCheckCall(transcript, load.executionStatus);

      // Override with direct webhook parameters if passed explicitly by telephony agent
      if (rawLocation) analysis.location = rawLocation;
      if (reportedEta) analysis.eta = reportedEta;
      if (detentionHours && detentionHours > 0) analysis.detentionHours = detentionHours;
      if (hasBreakdown) {
        analysis.isIssueDetected = true;
        analysis.issueSeverity = "URGENT";
        analysis.issueTitle = "MECHANICAL BREAKDOWN ALERT (VOICE AGENT)";
        analysis.issueDescription = `External telephony agent received breakdown confirmation at ${analysis.location}.`;
      }

      await prisma.$transaction(async (tx) => {
        // Create milestone event
        await tx.loadEvent.create({
          data: {
            loadId: load.id,
            eventType: "CHECK_CALL",
            location: analysis.location,
            message: analysis.statusUpdate,
            actorName: "AI Inbound/Outbound Telephony Webhook",
          },
        });

        // Advance execution status
        if (analysis.recommendedExecutionStatus && analysis.recommendedExecutionStatus !== load.executionStatus) {
          await tx.brokerageLoad.update({
            where: { id: load.id },
            data: { executionStatus: analysis.recommendedExecutionStatus },
          });
        }

        // Create urgent alert task if delay/breakdown/detention detected
        if (analysis.isIssueDetected) {
          // Assign to Ops Manager
          const opsManager = await tx.user.findFirst({
            where: { role: "OPERATIONS_MANAGER", status: "ACTIVE" },
          });

          await tx.task.create({
            data: {
              title: `[AI Voice Webhook] ${analysis.issueTitle || "Transit Exception"} - Load ${load.loadNumber}`,
              description: `${analysis.issueDescription || analysis.statusUpdate}\nTranscript: "${transcript}"`,
              priority: analysis.issueSeverity,
              assigneeId: opsManager ? opsManager.id : load.assignedOpsId || "system",
              createdById: opsManager ? opsManager.id : load.assignedOpsId || "system",
              status: "TODO",
              relatedType: "LOAD",
              relatedId: load.id,
            },
          });
        }
      });

      await logAuditEvent({
        actorName: "Vapi/SignalWire AI Voice Webhook",
        action: "WEBHOOK_CHECK_CALL_PROCESSED",
        entity: "BrokerageLoad",
        entityId: load.id,
        newValue: analysis,
      });

      return NextResponse.json({
        success: true,
        loadNumber: load.loadNumber,
        newExecutionStatus: analysis.recommendedExecutionStatus || load.executionStatus,
        analysis,
      });
    } else {
      // DISPATCH DIVISION
      const dLoad = await prisma.dispatchLoad.findUnique({
        where: { id: loadId },
        include: { client: true, truck: true },
      });

      if (!dLoad) {
        return NextResponse.json({ error: `Dispatch load ${loadId} not found.` }, { status: 404 });
      }

      const analysis = analyzeDriverCheckCall(transcript, dLoad.status);

      await prisma.$transaction(async (tx) => {
        await tx.checkCall.create({
          data: {
            dispatchLoadId: dLoad.id,
            location: rawLocation || analysis.location,
            statusUpdate: analysis.statusUpdate,
            notes: transcript,
          },
        });

        if (analysis.recommendedExecutionStatus) {
          await tx.dispatchLoad.update({
            where: { id: dLoad.id },
            data: { status: analysis.recommendedExecutionStatus },
          });
        }

        if (analysis.isIssueDetected) {
          const dispatcher = await tx.user.findFirst({
            where: { role: "DISPATCHER", status: "ACTIVE" },
          });

          await tx.task.create({
            data: {
              title: `[AI Voice Dispatch Alert] ${analysis.issueTitle || "Fleet Issue"} - Unit ${dLoad.truck.unitNumber}`,
              description: `${analysis.issueDescription || analysis.statusUpdate}\nTranscript: "${transcript}"`,
              priority: analysis.issueSeverity,
              assigneeId: dispatcher ? dispatcher.id : dLoad.dispatcherId || "system",
              createdById: dispatcher ? dispatcher.id : dLoad.dispatcherId || "system",
              status: "TODO",
              relatedType: "LOAD",
              relatedId: dLoad.id,
            },
          });
        }
      });

      await logAuditEvent({
        actorName: "Vapi/SignalWire AI Voice Webhook",
        action: "WEBHOOK_DISPATCH_CHECK_CALL_PROCESSED",
        entity: "DispatchLoad",
        entityId: dLoad.id,
        newValue: analysis,
      });

      return NextResponse.json({
        success: true,
        dispatchNumber: dLoad.dispatchNumber,
        status: analysis.recommendedExecutionStatus || dLoad.status,
        analysis,
      });
    }
  } catch (error: any) {
    console.error("AI Check-Call Webhook Exception:", error);
    return NextResponse.json(
      { error: "Internal Server Error processing check-call webhook.", details: error.message },
      { status: 500 }
    );
  }
}
