import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { approveCommissionAction } from "@/app/actions/accounting";
import {
  PiggyBank,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  User,
  ShieldCheck,
  Check,
} from "lucide-react";

export default async function CommissionsPage() {
  const user = await requireRole([
    "SUPER_ADMIN",
    "SALES_MANAGER",
    "SALES_AGENT",
    "DISPATCHER",
    "ACCOUNTING_MANAGER",
  ]);

  const isManager = ["SUPER_ADMIN", "SALES_MANAGER", "ACCOUNTING_MANAGER"].includes(user.role);

  const commissions = await prisma.commission.findMany({
    where: isManager ? {} : { userId: user.id },
    include: {
      user: true,
      brokerageLoad: true,
      dispatchLoad: true,
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEarned = commissions.reduce((sum, c) => sum + c.earnedAmount, 0);
  const totalApproved = commissions
    .filter((c) => c.status === "APPROVED" || c.status === "PAID")
    .reduce((sum, c) => sum + c.earnedAmount, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-600" /> Employee Commissions & Incentive Plans
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Performance commissions calculated on approved Brokerage Gross Margin and Dispatch Service Fees.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Commissions Generated</div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ${totalEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Total incentives calculated across eligible loads</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved for Payroll Payout</div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            ${totalApproved.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Manager sign-off completed</div>
        </div>
      </div>

      {/* Commission Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Commissions Calculation Ledger
          </h3>
          <span className="text-xs text-slate-500">{commissions.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Division / Plan</th>
                <th className="px-4 py-3">Reference Load</th>
                <th className="px-4 py-3">Eligible Base (Margin/Fee)</th>
                <th className="px-4 py-3">Incentive Rate</th>
                <th className="px-4 py-3">Earned Commission</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {commissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{comm.user.firstName} {comm.user.lastName}</div>
                    <div className="text-[10px] text-slate-400">{comm.user.employeeId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{comm.division}</div>
                    <div className="text-[10px] text-slate-400">{comm.plan?.name || "Standard Plan"}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {comm.brokerageLoad?.loadNumber || comm.dispatchLoad?.dispatchNumber || "General"}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    ${comm.baseAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">
                    {comm.commissionRate}%
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700 text-sm">
                    ${comm.earnedAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      comm.status === "APPROVED" || comm.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {comm.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {comm.status === "PENDING" && isManager ? (
                      <form action={async () => {
                        "use server";
                        await approveCommissionAction(comm.id);
                      }}>
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] shadow-xs flex items-center gap-1 ml-auto"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </form>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {comm.status === "APPROVED" ? "Approved" : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
