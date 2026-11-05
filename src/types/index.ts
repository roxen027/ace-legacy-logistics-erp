export type UserRole =
  | "SUPER_ADMIN"
  | "HR_MANAGER"
  | "SALES_MANAGER"
  | "SALES_AGENT"
  | "OPERATIONS_MANAGER"
  | "DISPATCHER"
  | "ACCOUNTING_MANAGER"
  | "ACCOUNTANT";

export type Division = "ALL" | "BROKERAGE" | "DISPATCH";

export interface SessionUser {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  departmentName?: string | null;
  branchCode?: string | null;
  title?: string | null;
}

export interface AuthSession {
  user?: SessionUser;
  isLoggedIn: boolean;
}
