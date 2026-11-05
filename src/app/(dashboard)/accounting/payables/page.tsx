import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { approveCarrierPayableAction, disburseCarrierPaymentAction } from "@/app/actions/accounting";
import {
  Receipt,
  Truck,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Check,
} from "lucide-react";

export default async function PayablesPage() {
  const user = await requireRole([
    "SUPER_ADMIN",
    "OPERATIONS_MANAGER",
    "ACCOUNTING_MANAGER",
    "ACCOUNTANT",
  ]);

  const payables = await prisma.carrierPayable.findMany({
    include: {
      carrier: true,
      load: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const isManager = ["SUPER_ADMIN", "ACCOUNTING_MANAGER"].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" /> Accounts Payable (Carrier Freight AP)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Motor carrier settlement audit, 3-way rate confirmation matching, payment approvals, and remittance processing.
          </p>
        </div>
      </div>

      {/* Payables Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Carrier Settlements & Rate Confirmation Audit
          </h3>
          <span className="text-xs text-slate-500">{payables.length} Payable Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3">Payable # / Load</th>
                <th className="px-4 py-3">Contracted Carrier</th>
                <th className="px-4 py-3">Carrier Invoice #</th>
                <th className="px-4 py-3">Agreed Pay</th>
                <th className="px-4 py-3">Approved Accessorials</th>
                <th className="px-4 py-3">Total Due</th>
                <th className="px-4 py-3">Audit Status</th>
                <th className="px-4 py-3 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {payables.map((ap) => (
                <tr key={ap.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-blue-600">{ap.payableNumber}</div>
                    <div className="text-[10px] text-slate-400">Load: {ap.load.loadNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{ap.carrier.legalName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">MC-{ap.carrier.mcNumber}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">
                    {ap.carrierInvoiceNo}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    ${ap.amountAgreed.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    ${ap.accessorialApproved.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    ${ap.totalDue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ap.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : ap.status === "APPROVED_FOR_PAYMENT"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {ap.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {ap.status === "PENDING_AUDIT" && isManager && (
                      <form action={async () => {
                        "use server";
                        await approveCarrierPayableAction(ap.id);
                      }}>
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[11px] shadow-xs flex items-center gap-1 ml-auto"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve Pay
                        </button>
                      </form>
                    )}

                    {ap.status === "APPROVED_FOR_PAYMENT" && (
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          await disburseCarrierPaymentAction(formData);
                        }}
                        className="inline-flex items-center gap-1.5 justify-end"
                      >
                        <input type="hidden" name="payableId" value={ap.id} />
                        <input
                          name="paymentReference"
                          placeholder="ACH/Wire Ref#"
                          required
                          className="w-24 p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] shadow-xs"
                        >
                          Disburse
                        </button>
                      </form>
                    )}

                    {ap.status === "PAID" && (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Settled ({ap.paymentReference || "ACH"})
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
