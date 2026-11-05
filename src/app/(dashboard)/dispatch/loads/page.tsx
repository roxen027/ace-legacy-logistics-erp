import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createDispatchLoadAction, billDispatchFeeAction } from "@/app/actions/dispatch";
import { AiFleetMatcherModal } from "@/components/ai/AiFleetMatcherModal";
import { AiDocumentParserModal } from "@/components/ai/AiDocumentParserModal";
import { AiCheckCallModal } from "@/components/ai/AiCheckCallModal";
import {
  Truck,
  Plus,
  DollarSign,
  Receipt,
  CheckCircle2,
  Building,
  MapPin,
  Clock,
  ArrowRight,
  Send,
  AlertCircle,
} from "lucide-react";

export default async function DispatchLoadsPage() {
  await requireRole([
    "SUPER_ADMIN",
    "OPERATIONS_MANAGER",
    "DISPATCHER",
    "ACCOUNTING_MANAGER",
  ]);

  const [dispatchLoads, clients, availableTrucks] = await Promise.all([
    prisma.dispatchLoad.findMany({
      include: {
        client: true,
        truck: true,
        driver: true,
        checkCalls: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dispatchClient.findMany({ where: { status: "ACTIVE" } }),
    prisma.truck.findMany({
      where: { status: { in: ["AVAILABLE", "UNDER_LOAD"] } },
      include: { client: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" /> Dispatched Loads Board & Service Fee Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatching owner-operators, sourcing external freight broker loads, and generating weekly service fee statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AiFleetMatcherModal />
          <AiDocumentParserModal defaultDivision="DISPATCH" />
        </div>
      </div>

      {/* Book Load Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-600" /> Book Dispatched Load for Client Truck
        </h3>

        <form
          action={async (formData: FormData) => {
            "use server";
            await createDispatchLoadAction(formData);
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dispatch Client</label>
            <select name="clientId" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName} (Fee: {c.feeValue}%)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Unit</label>
            <select name="truckId" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold">
              {availableTrucks.map((t) => (
                <option key={t.id} value={t.id}>{t.unitNumber} - {t.client.companyName} ({t.status})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Broker Name</label>
            <input
              name="brokerName"
              required
              placeholder="e.g. C.H. Robinson / TQL"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Broker Phone / Contact</label>
            <input
              name="brokerPhone"
              placeholder="+1 (800) 555-0199"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
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
              <input name="destCity" required placeholder="Chicago" className="col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              <input name="destState" required placeholder="IL" maxLength={2} className="p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Loaded Miles / Deadhead</label>
            <div className="grid grid-cols-2 gap-2">
              <input name="loadedMiles" type="number" required placeholder="920 mi" className="p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              <input name="deadheadMiles" type="number" defaultValue="25" placeholder="DH mi" className="p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Gross Freight Pay ($)</label>
            <input
              name="grossFreightRate"
              type="number"
              step="10"
              required
              placeholder="2800.00"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Book Dispatched Load
            </button>
          </div>
        </form>

        <div className="mt-3 text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Accounting Rule: Ace Legacy Services recognizes <strong>only the calculated Dispatch Service Fee</strong> as corporate revenue. The carrier's gross freight remains the property of the motor carrier.</span>
        </div>
      </div>

      {/* Dispatched Loads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Active Dispatched Shipments & Billing Ledger
          </h3>
          <span className="text-xs text-slate-500">{dispatchLoads.length} Dispatched Loads</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3">Dispatch #</th>
                <th className="px-4 py-3">Carrier Client / Truck</th>
                <th className="px-4 py-3">External Broker</th>
                <th className="px-4 py-3">Lane & Miles</th>
                <th className="px-4 py-3">Carrier Gross Pay</th>
                <th className="px-4 py-3">Ace Service Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Fee Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {dispatchLoads.map((dLoad) => (
                <tr key={dLoad.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                    {dLoad.dispatchNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{dLoad.client.companyName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Unit: {dLoad.truck.unitNumber} {dLoad.driver ? `• ${dLoad.driver.firstName}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{dLoad.brokerName}</div>
                    <div className="text-[10px] text-slate-400">{dLoad.brokerPhone || "Direct Broker"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">
                      {dLoad.originCity}, {dLoad.originState} $\rightarrow$ {dLoad.destCity}, {dLoad.destState}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dLoad.loadedMiles} mi loaded • ${dLoad.ratePerMile}/mi
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    ${dLoad.grossFreightRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold font-mono text-emerald-700">
                      ${dLoad.calculatedFee.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">({dLoad.feeRate}% contracted)</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      dLoad.status === "BILLED"
                        ? "bg-purple-100 text-purple-800"
                        : dLoad.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {dLoad.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {dLoad.status !== "BILLED" && dLoad.status !== "CANCELLED" && (
                        <AiCheckCallModal
                          loadId={dLoad.id}
                          loadNumber={dLoad.dispatchNumber}
                          driverName={dLoad.driver ? dLoad.driver.firstName : undefined}
                          division="DISPATCH"
                        />
                      )}

                      {!dLoad.feeBilled ? (
                        <form action={async () => {
                          "use server";
                          await billDispatchFeeAction(dLoad.id);
                        }}>
                          <button
                            type="submit"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded shadow-xs flex items-center gap-1"
                          >
                            <Receipt className="w-3 h-3" /> Issue Statement
                          </button>
                        </form>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Billed
                        </span>
                      )}
                    </div>
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
