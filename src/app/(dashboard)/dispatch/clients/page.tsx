import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createDispatchClientAction } from "@/app/actions/dispatch";
import {
  Building2,
  Plus,
  Truck,
  Phone,
  Mail,
  Receipt,
  CheckCircle2,
  Calendar,
  DollarSign,
} from "lucide-react";

export default async function DispatchClientsPage() {
  await requireRole([
    "SUPER_ADMIN",
    "OPERATIONS_MANAGER",
    "DISPATCHER",
    "ACCOUNTING_MANAGER",
  ]);

  const clients = await prisma.dispatchClient.findMany({
    include: {
      trucks: { include: { drivers: true } },
      dispatchLoads: { take: 5, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" /> Dispatch Clients & Service Agreements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage owner-operators and small carrier fleets under dispatch service contracts.
          </p>
        </div>
      </div>

      {/* Onboard Client Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-600" /> Onboard Motor Carrier / Dispatch Client
        </h3>

        <form
          action={async (formData: FormData) => {
            "use server";
            await createDispatchClientAction(formData);
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company / Fleet Name</label>
            <input
              name="companyName"
              required
              placeholder="e.g. Lonestar Express Logistics LLC"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Owner / Primary Contact</label>
            <input
              name="ownerName"
              required
              placeholder="e.g. Carlos Mendoza"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">MC Number</label>
            <input
              name="mcNumber"
              placeholder="MC-819201"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">USDOT Number</label>
            <input
              name="dotNumber"
              placeholder="USDOT-3210981"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
            <input
              name="phone"
              required
              placeholder="+1 (555) 789-0123"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="carlos@lonestarexpress.com"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fee Model</label>
            <select name="feeType" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
              <option value="PERCENTAGE">Percentage of Gross Freight (8% - 10%)</option>
              <option value="FLAT_WEEKLY">Flat Weekly Retainer per Truck ($250)</option>
              <option value="PER_LOAD">Flat Fee Per Dispatched Load ($75)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contract Fee Value (% or $)</label>
            <input
              name="feeValue"
              type="number"
              step="0.5"
              defaultValue="8.0"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Sign & Save Dispatch Agreement
            </button>
          </div>
        </form>
      </div>

      {/* Clients Register */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Active Client Accounts & Fleet Inventory
          </h3>
          <span className="text-xs text-slate-500">{clients.length} Active Carrier Clients</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3">Code / Client</th>
                <th className="px-4 py-3">Owner / Contact</th>
                <th className="px-4 py-3">Authority</th>
                <th className="px-4 py-3">Contract Service Fee</th>
                <th className="px-4 py-3">Assigned Units</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{client.companyName}</div>
                    <div className="text-[10px] text-emerald-700 font-mono font-bold">{client.clientCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{client.ownerName}</div>
                    <div className="text-[11px] text-slate-500">{client.phone} • {client.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div className="font-bold text-slate-800">{client.mcNumber || "Intrastate"}</div>
                    <div className="text-[10px] text-slate-400">DOT: {client.dotNumber || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {client.feeType === "PERCENTAGE" ? `${client.feeValue}% Gross Freight` : `$${client.feeValue} / ${client.feeType}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{client.trucks.length} Trucks</div>
                    <div className="text-[10px] text-slate-400">
                      {client.trucks.map((t) => t.unitNumber).join(", ") || "No units registered"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {client.status}
                    </span>
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
