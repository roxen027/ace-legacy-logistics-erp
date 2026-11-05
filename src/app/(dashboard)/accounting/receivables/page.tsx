import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { recordCustomerPaymentAction } from "@/app/actions/accounting";
import {
  Receipt,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  CreditCard,
  Plus,
} from "lucide-react";

export default async function ReceivablesPage() {
  await requireRole([
    "SUPER_ADMIN",
    "SALES_MANAGER",
    "ACCOUNTING_MANAGER",
    "ACCOUNTANT",
  ]);

  const invoices = await prisma.invoice.findMany({
    where: { division: "BROKERAGE" },
    include: {
      customer: true,
      brokerageLoad: true,
      paymentAllocations: { include: { payment: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAR = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-600" /> Accounts Receivable (Shipper Freight AR)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Shipper invoice generation, collections, aging schedule, and payment allocations.
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Invoiced AR</div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ${totalAR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Total freight billed across all shippers</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Collected Cash</div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            ${totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Cleared bank deposits via ACH / Wire</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding Balance</div>
          <div className="mt-2 text-2xl font-black text-purple-700">
            ${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Current unpaid customer balances</div>
        </div>
      </div>

      {/* Invoices Table & Record Payment Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Shipper Freight Invoices Ledger
          </h3>
          <span className="text-xs text-slate-500">{invoices.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3">Invoice # / Load</th>
                <th className="px-4 py-3">Customer Shipper</th>
                <th className="px-4 py-3">Issue / Due Date</th>
                <th className="px-4 py-3">Invoice Total</th>
                <th className="px-4 py-3">Amount Paid</th>
                <th className="px-4 py-3">Balance Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Apply Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-purple-700">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400">
                      Load: {inv.brokerageLoad?.loadNumber || "Direct Billing"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{inv.customer?.name}</div>
                    <div className="text-[10px] text-slate-400">Terms: {inv.paymentTerms}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>Issued: {new Date(inv.issueDate).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    ${inv.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-700">
                    ${inv.amountPaid.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-purple-700">
                    ${inv.balanceDue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === "PAID_IN_FULL"
                        ? "bg-emerald-100 text-emerald-800"
                        : inv.status === "PARTIALLY_PAID"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {inv.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inv.balanceDue > 0 ? (
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          await recordCustomerPaymentAction(formData);
                        }}
                        className="inline-flex items-center gap-1.5 justify-end"
                      >
                        <input type="hidden" name="invoiceId" value={inv.id} />
                        <input
                          name="amount"
                          type="number"
                          step="0.01"
                          defaultValue={inv.balanceDue}
                          required
                          className="w-20 p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold"
                        />
                        <input
                          name="referenceNumber"
                          placeholder="ACH/Chk#"
                          required
                          className="w-20 p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-[11px] shadow-xs"
                        >
                          Receive
                        </button>
                      </form>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
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
