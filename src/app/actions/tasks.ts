"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function createTaskAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = (formData.get("priority") as string) || "MEDIUM";
  const assigneeId = (formData.get("assigneeId") as string) || user.id;
  const dueDateStr = formData.get("dueDate") as string;
  const dueDate = dueDateStr ? new Date(dueDateStr) : null;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority,
      assigneeId,
      createdById: user.id,
      dueDate,
      status: "TODO",
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "CREATE_TASK",
    entity: "Task",
    entityId: task.id,
  });

  revalidatePath("/tasks");
  return { success: true };
}

export async function toggleTaskStatusAction(taskId: string, currentStatus: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED";
  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });

  revalidatePath("/tasks");
  return { success: true };
}
