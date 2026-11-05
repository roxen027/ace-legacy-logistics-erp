"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/types";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      department: true,
      branch: true,
    },
  });

  if (!user) {
    return { error: "Invalid email or password credentials." };
  }

  if (user.status !== "ACTIVE") {
    return { error: `Your account is currently ${user.status.toLowerCase()}. Please contact your administrator.` };
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return { error: "Invalid email or password credentials." };
  }

  const session = await getSession();
  session.user = {
    id: user.id,
    employeeId: user.employeeId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role as UserRole,
    departmentId: user.departmentId,
    departmentName: user.department?.name,
    branchCode: user.branch?.code,
    title: user.title,
  };
  session.isLoggedIn = true;
  await session.save();

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "LOGIN",
    entity: "User",
    entityId: user.id,
    newValue: { email: user.email, role: user.role },
  });

  redirect("/");
}

export async function fastLoginAction(role: UserRole) {
  const user = await prisma.user.findFirst({
    where: { role, status: "ACTIVE" },
    include: {
      department: true,
      branch: true,
    },
  });

  if (!user) {
    throw new Error(`No active user found for role: ${role}`);
  }

  const session = await getSession();
  session.user = {
    id: user.id,
    employeeId: user.employeeId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role as UserRole,
    departmentId: user.departmentId,
    departmentName: user.department?.name,
    branchCode: user.branch?.code,
    title: user.title,
  };
  session.isLoggedIn = true;
  await session.save();

  await logAuditEvent({
    userId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    action: "SWITCH_ROLE_DEMO",
    entity: "User",
    entityId: user.id,
    newValue: { role: user.role, fastDemo: true },
  });

  revalidatePath("/");
  redirect("/");
}

export async function logoutAction() {
  const session = await getSession();
  const user = session.user;

  if (user) {
    await logAuditEvent({
      userId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      action: "LOGOUT",
      entity: "User",
      entityId: user.id,
    });
  }

  session.destroy();
  redirect("/login");
}
