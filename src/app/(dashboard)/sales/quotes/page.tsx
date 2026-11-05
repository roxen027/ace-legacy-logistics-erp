import { requireRole, canApproveQuotes } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  createQuoteAction,
  approveQuoteAction,
  recordCustomerDecisionAction,
  convertQuoteToLoadAction,
  reviseQuoteAction,
} from "@/app/actions/sales";
import { AiQuoteIntakeDrawer } from "@/components/ai/AiQuoteIntakeDrawer";
import Link from "next/link";
import {
  FileText,
  Plus,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  History,
  Check,
} from "lucide-react";

export default async function QuotesPage() {
  const user = await requireRole([
    "SUPER_ADMIN",
    "SALES_MANAGER",
    "SALES_AGENT",
    "OPERATIONS_MANAGER",
  ]);

  const isApprover = canApproveQuotes(user);

  const [quotes, customers] = await Promise.all([
    prisma.quote.findMany({
      include: {
        customer: true,
        createdBy: true,
        versions: { orderBy: { versionNumber: "desc" } },
        convertedLoad: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Multi-Version Quotes & Pricing Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build freight quotes, track complete revision histories, enforce manager margin approval, and convert accepted deals to brokerage loads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AiQuoteIntakeDrawer />
        </div>
      </div>

      {/* Build Quote Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> Build New Freight Quotation
        </h3>

        <form
          action={async (formData: FormData) => {
            "use server";
            await createQuoteAction(formData);
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Shipper / Customer</label>
            <select name="customerId" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Origin City & State</label>
            <div className="grid grid-cols-3 gap-2">
              <input name="originCity" required placeholder="Dallas" className="col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              <input name="originState" required placeholder="TX" maxLength={2} className="p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Destination City & State</label>
            <div className="grid grid-cols-3 gap-2">
              <input name="destCity" required placeholder="Atlanta" className="col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              <input name="destState" required placeholder="GA" maxLength={2} className="p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Equipment Type</label>
            <select name="equipment" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <option value="DRY_VAN">Dry Van (53ft)</option>
              <option value="REEFER">Reefer (Refrigerated)</option>
              <option value="FLATBED">Flatbed (48/53ft)</option>
              <option value="STEP_DECK">Step Deck</option>
              <option value="POWER_ONLY">Power Only</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Total Miles</label>
            <input name="totalMiles" type="number" step="1" placeholder="780" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer Quoted Rate ($)</label>
            <input name="customerRate" type="number" step="10" required placeholder="3400.00" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Estimated Carrier Cost ($)</label>
            <input name="carrierEstimatedCost" type="number" step="10" required placeholder="2800.00" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Save Quote (v1)
            </button>
          </div>
        </form>

        <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Governance Policy: Quotes yielding estimated gross margins below <strong>12.00%</strong> automatically flag for Manager Review prior to final release.</span>
        </div>
      </div>

      {/* Quotes Register & Versions List */}
      <div className="space-y-4">
        {quotes.map((quote) => {
          const latest = quote.versions[0];
          const isMarginLow = (latest?.marginPercentage || 0) < 12.0;

          return (
            <div
              key={quote.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Quote Top Bar */}
              <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 font-mono font-bold text-xs">
                    {quote.quoteNumber}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      {quote.customer.name}
                      <span className="text-slate-400 font-normal">|</span>
                      <span className="text-xs font-semibold text-slate-600">
                        {quote.originCity}, {quote.originState} $\rightarrow$ {quote.destCity}, {quote.destState} ({quote.totalMiles} mi)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Created by {quote.createdBy.firstName} {quote.createdBy.lastName} • Version {quote.currentVersion} of {quote.versions.length}
                    </div>
                  </div>
                </div>

                {/* Status Badges & Conversion Action */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Internal Approval Badge */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    quote.internalApprovalStatus === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {quote.internalApprovalStatus === "APPROVED" ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    Internal: {quote.internalApprovalStatus}
                  </span>

                  {/* Customer Status Badge */}
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    quote.status === "CUSTOMER_ACCEPTED"
                      ? "bg-emerald-100 text-emerald-800"
                      : quote.status === "CONVERTED"
                      ? "bg-purple-100 text-purple-800"
                      : quote.status === "CUSTOMER_REJECTED"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    Shipper: {quote.status.replace(/_/g, " ")}
                  </span>

                  {/* Manager Approval Button */}
                  {isApprover && quote.internalApprovalStatus === "PENDING" && (
                    <form action={async () => {
                      "use server";
                      await approveQuoteAction(quote.id);
                    }}>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Rate
                      </button>
                    </form>
                  )}

                  {/* Single Conversion to Load Action */}
                  {quote.status === "CUSTOMER_ACCEPTED" && !quote.convertedLoadId && (
                    <form action={async () => {
                      "use server";
                      await convertQuoteToLoadAction(quote.id);
                    }}>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 animate-pulse"
                      >
                        <Layers className="w-3.5 h-3.5" /> Convert to Brokerage Load
                      </button>
                    </form>
                  )}

                  {quote.convertedLoad && (
                    <Link
                      href={`/brokerage/loads`}
                      className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs rounded-lg flex items-center gap-1"
                    >
                      Load {quote.convertedLoad.loadNumber} <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Version History Table */}
              <div className="p-4 bg-white">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-600" /> Version History & Pricing Offers
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2">Version</th>
                        <th className="px-3 py-2">Customer Quoted</th>
                        <th className="px-3 py-2">Carrier Est. Cost</th>
                        <th className="px-3 py-2">Est. Gross Margin</th>
                        <th className="px-3 py-2">Shipper Decision</th>
                        <th className="px-3 py-2">Notes</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {quote.versions.map((ver) => (
                        <tr key={ver.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-bold text-slate-900">v{ver.versionNumber}</td>
                          <td className="px-3 py-2 font-bold font-mono text-slate-900">${ver.customerRate.toFixed(2)}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">${ver.carrierEstimatedCost.toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <span className={`font-bold font-mono ${ver.marginPercentage < 12 ? "text-amber-700" : "text-emerald-700"}`}>
                              +${ver.estimatedMargin.toFixed(2)} ({ver.marginPercentage.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ver.customerDecision === "ACCEPTED"
                                ? "bg-emerald-100 text-emerald-800"
                                : ver.customerDecision === "COUNTER_OFFER"
                                ? "bg-amber-100 text-amber-800"
                                : ver.customerDecision === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {ver.customerDecision}
                            </span>
                            {ver.counterOfferAmount && (
                              <div className="text-[10px] text-amber-800 font-mono font-bold">Counter: ${ver.counterOfferAmount}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-[11px] max-w-xs truncate">{ver.notes || "—"}</td>
                          <td className="px-3 py-2 text-right">
                            {ver.customerDecision === "PENDING" && quote.status !== "CONVERTED" && (
                              <div className="flex items-center justify-end gap-1">
                                <form action={async () => {
                                  "use server";
                                  await recordCustomerDecisionAction(quote.id, "ACCEPTED");
                                }}>
                                  <button
                                    type="submit"
                                    title="Record Customer Acceptance"
                                    className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold"
                                  >
                                    Accept
                                  </button>
                                </form>

                                <form action={async () => {
                                  "use server";
                                  await recordCustomerDecisionAction(quote.id, "REJECTED");
                                }}>
                                  <button
                                    type="submit"
                                    title="Record Customer Rejection"
                                    className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 font-bold"
                                  >
                                    Reject
                                  </button>
                                </form>
                              </div>
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
        })}
      </div>
    </div>
  );
}
