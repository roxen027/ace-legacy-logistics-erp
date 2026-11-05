"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function clockInAction(notes?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already clocked in today without clock out
  const existing = await prisma.attendance.findFirst({
    where: {
      userId: user.id,
      date: today,
      clockOut: null,
    },
  });

  if (existing) {
    return { error: "You are already clocked in." };
  }

  // Determine lateness based on shift
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    include: { shift: true },
  });

  let status = "PRESENT";
  const now = new Date();
  if (userRecord?.shift?.startTime) {
    const [startH, startM] = userRecord.shift.startTime.split(":").map(Number);
    const shiftStart = new Date(now);
    shiftStart.setHours(startH, startM + (userRecord.shift.graceMinutes || 15), 0, 0);

    if (now > shiftStart) {
      status = "LATE";
    }
  }

  const attendance = await prisma.attendance.create({
    data: {
      userId: user.id,
      date: today,
      clockIn: now,
      status,
      notes: notes || "Web clock-in recorded",
      ipAddress: "127.0.0.1",
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "CLOCK_IN",
    entity: "Attendance",
    entityId: attendance.id,
    newValue: { clockIn: now, status },
  });

  revalidatePath("/hr/attendance");
  revalidatePath("/");
  return { success: true, status };
}

export async function clockOutAction(breakMinutes: number = 0, notes?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeAttendance = await prisma.attendance.findFirst({
    where: {
      userId: user.id,
      date: today,
      clockOut: null,
    },
  });

  if (!activeAttendance) {
    return { error: "No active clock-in found to clock out." };
  }

  const clockOutTime = new Date();
  const diffMs = clockOutTime.getTime() - activeAttendance.clockIn.getTime();
  const workedHours = Math.max(0, (diffMs / (1000 * 60 * 60)) - (breakMinutes / 60));
  const regularHours = Math.min(8.0, workedHours);
  const overtimeHours = Math.max(0, workedHours - 8.0);

  await prisma.attendance.update({
    where: { id: activeAttendance.id },
    data: {
      clockOut: clockOutTime,
      breakMinutes,
      totalHours: Number(workedHours.toFixed(2)),
      overtimeHours: Number(overtimeHours.toFixed(2)),
      notes: notes ? `${activeAttendance.notes || ""}; ${notes}` : activeAttendance.notes,
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "CLOCK_OUT",
    entity: "Attendance",
    entityId: activeAttendance.id,
    newValue: { clockOut: clockOutTime, totalHours: workedHours, overtimeHours },
  });

  revalidatePath("/hr/attendance");
  revalidatePath("/");
  return { success: true };
}

export async function submitLeaveRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const leaveType = formData.get("leaveType") as string;
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);
  const reason = formData.get("reason") as string;
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);

  await prisma.leaveRequest.create({
    data: {
      userId: user.id,
      leaveType,
      startDate,
      endDate,
      totalDays: days,
      reason,
      status: "PENDING",
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "CREATE",
    entity: "LeaveRequest",
    newValue: { leaveType, days, reason },
  });

  revalidatePath("/hr/attendance");
  return { success: true };
}

export async function createEmployeeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "HR_MANAGER"].includes(user.role)) {
    throw new Error("Unauthorized permission to create employees.");
  }

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = (formData.get("email") as string).toLowerCase().trim();
  const role = formData.get("role") as string;
  const departmentId = formData.get("departmentId") as string;
  const title = formData.get("title") as string;
  const phone = formData.get("phone") as string;
  const baseSalary = parseFloat(formData.get("baseSalary") as string || "0");
  const hourlyRate = parseFloat(formData.get("hourlyRate") as string || "0");

  const count = await prisma.user.count();
  const employeeId = `EMP-${1000 + count + 1}`;
  const defaultPassword = await bcrypt.hash("admin123", 10);

  const newEmployee = await prisma.user.create({
    data: {
      employeeId,
      firstName,
      lastName,
      email,
      passwordHash: defaultPassword,
      role,
      departmentId: departmentId || null,
      title,
      phone,
      baseSalary,
      hourlyRate,
      status: "ACTIVE",
      hireDate: new Date(),
    },
  });

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "CREATE",
    entity: "User",
    entityId: newEmployee.id,
    newValue: { employeeId, email, role },
  });

  revalidatePath("/hr/employees");
  return { success: true };
}
