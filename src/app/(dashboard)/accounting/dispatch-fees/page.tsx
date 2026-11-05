import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { recordCustomerPaymentAction } from "@/app/actions/accounting";
import {
  Receipt,
  DollarSign,
  Truck,
  CheckCircle2,
  Building,
  CreditCard,
} from "lucide-react";

export default async function DispatchFeesPage() {
  await requireRole([
    "SUPER_ADMIN",
    "ACCOUNTING_MANAGER",
    "ACCOUNTANT",
  ]);

  const statements = await prisma.invoice.findMany({
    where: { division: "DISPATCH" },
    include: {
      dispatchClient: true,
      lines: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalFeesBilled = statements.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalFeesCollected = statements.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalFeesPending = statements.reduce((sum, s) => sum + s.balanceDue, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" /> Dispatch Service Fee Invoicing & Collections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Weekly statements and service fee billing for contracted owner-operators and carrier fleets.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Dispatch Fees Billed</div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ${totalFeesBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Ace Legacy Services contracted service revenue</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Fees Collected</div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            ${totalFeesCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Cleared client collections</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Uncollected Fees Pending</div>
          <div className="mt-2 text-2xl font-black text-amber-700">
            ${totalFeesPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Current open fee statements</div>
        </div>
      </div>

      {/* Statements Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Client Weekly Statements Ledger
          </h3>
          <span className="text-xs text-slate-500">{statements.length} Fee Statements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3">Statement #</th>
                <th className="px-4 py-3">Dispatch Client</th>
                <th className="px-4 py-3">Statement Date</th>
                <th className="px-4 py-3">Fee Amount</th>
                <th className="px-4 py-3">Amount Collected</th>
                <th className="px-4 py-3">Balance Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Collect Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {statements.map((stmt) => (
                <tr key={stmt.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                    {stmt.invoiceNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{stmt.dispatchClient?.companyName}</div>
                    <div className="text-[10px] text-slate-400">{stmt.dispatchClient?.clientCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>Issued: {new Date(stmt.issueDate).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">Due: {new Date(stmt.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    ${stmt.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-700">
                    ${stmt.amountPaid.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-700">
                    ${stmt.balanceDue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      stmt.status === "PAID_IN_FULL"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {stmt.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {stmt.balanceDue > 0 ? (
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          await recordCustomerPaymentAction(formData);
                        }}
                        className="inline-flex items-center gap-1.5 justify-end"
                      >
                        <input type="hidden" name="invoiceId" value={stmt.id} />
                        <input
                          name="amount"
                          type="number"
                          step="0.01"
                          defaultValue={stmt.balanceDue}
                          required
                          className="w-16 p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold"
                        />
                        <input
                          name="referenceNumber"
                          placeholder="Zelle/ACH"
                          required
                          className="w-20 p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] shadow-xs"
                        >
                          Collect
                        </button>
                      </form>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Collected
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
