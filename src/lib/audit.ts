import { prisma } from "./prisma";

interface AuditEventParams {
  userId?: string | null;
  actorName: string;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
}

export async function logAuditEvent({
  userId,
  actorName,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
  ipAddress,
}: AuditEventParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        actorName,
        action,
        entity,
        entityId: entityId || null,
        oldValue: oldValue ? (typeof oldValue === "string" ? oldValue : JSON.stringify(oldValue)) : null,
        newValue: newValue ? (typeof newValue === "string" ? newValue : JSON.stringify(newValue)) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log event:", error);
  }
}
