import { SessionUser, UserRole } from "@/types";
import { getCurrentUser } from "./auth";
import { redirect } from "next/navigation";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  HR_MANAGER: 70,
  SALES_MANAGER: 60,
  OPERATIONS_MANAGER: 60,
  ACCOUNTING_MANAGER: 60,
  SALES_AGENT: 40,
  DISPATCHER: 40,
  ACCOUNTANT: 40,
};

export function hasRole(user: SessionUser | null | undefined, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return allowedRoles.includes(user.role);
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!hasRole(user, allowedRoles)) {
    redirect("/unauthorized");
  }
  return user;
}

// Granular feature permissions
export function canViewBrokerageMargin(user: SessionUser | null): boolean {
  if (!user) return false;
  return ["SUPER_ADMIN", "SALES_MANAGER", "OPERATIONS_MANAGER", "ACCOUNTING_MANAGER"].includes(user.role);
}

export function canApproveQuotes(user: SessionUser | null): boolean {
  if (!user) return false;
  return ["SUPER_ADMIN", "SALES_MANAGER"].includes(user.role);
}

export function canManagePayables(user: SessionUser | null): boolean {
  if (!user) return false;
  return ["SUPER_ADMIN", "ACCOUNTING_MANAGER", "ACCOUNTANT"].includes(user.role);
}

export function canManageAttendance(user: SessionUser | null): boolean {
  if (!user) return false;
  return ["SUPER_ADMIN", "HR_MANAGER"].includes(user.role);
}

export function canViewAllLeads(user: SessionUser | null): boolean {
  if (!user) return false;
  return ["SUPER_ADMIN", "SALES_MANAGER"].includes(user.role);
}
