import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createCarrierAction } from "@/app/actions/brokerage";
import {
  Car,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  FileText,
  Building,
  Award,
} from "lucide-react";

export default async function CarriersPage() {
  await requireRole([
    "SUPER_ADMIN",
    "OPERATIONS_MANAGER",
    "DISPATCHER",
    "ACCOUNTING_MANAGER",
    "ACCOUNTANT",
  ]);

  const carriers = await prisma.carrier.findMany({
    include: {
      contacts: true,
      documents: true,
      brokerageLoads: { take: 3, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" /> Motor Carrier Compliance & Safety Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vetting motor carriers, tracking COI insurance limits, W-9 tax compliance, and safety ratings.
          </p>
        </div>
      </div>

      {/* Onboard Carrier Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> Onboard Qualified Motor Carrier
        </h3>

        <form
          action={async (formData: FormData) => {
            "use server";
            await createCarrierAction(formData);
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Carrier Legal Name</label>
            <input
              name="legalName"
              required
              placeholder="e.g. Swift Haul Transport LLC"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">MC Number</label>
            <input
              name="mcNumber"
              required
              placeholder="e.g. MC-981240"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 uppercase font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">USDOT Number</label>
            <input
              name="dotNumber"
              placeholder="e.g. 3829101"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dispatch Phone</label>
            <input
              name="phone"
              required
              placeholder="+1 (555) 392-1029"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dispatch Email</label>
            <input
              name="dispatchEmail"
              type="email"
              required
              placeholder="dispatch@carrier.com"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cargo Insurance ($)</label>
            <input
              name="insuranceCargoAmount"
              type="number"
              defaultValue="100000"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Auto Liability ($)</label>
            <input
              name="insuranceAutoAmount"
              type="number"
              defaultValue="1000000"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
            <select name="paymentTerms" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
              <option value="NET_30">Net 30 Days</option>
              <option value="QUICK_PAY_1_5">QuickPay (1.5% Fee)</option>
              <option value="NET_15">Net 15 Days</option>
            </select>
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Verify & Register Carrier
            </button>
          </div>
        </form>
      </div>

      {/* Carriers List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Approved Motor Carriers Directory
          </h3>
          <span className="text-xs text-slate-500">{carriers.length} Vetted Carriers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3">Carrier Legal Name</th>
                <th className="px-4 py-3">MC / USDOT</th>
                <th className="px-4 py-3">Dispatch Contact</th>
                <th className="px-4 py-3">Insurance Coverage</th>
                <th className="px-4 py-3">Compliance Docs</th>
                <th className="px-4 py-3">Payment Terms</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {carriers.map((carrier) => (
                <tr key={carrier.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{carrier.legalName}</div>
                    {carrier.dba && <div className="text-[10px] text-slate-400">DBA: {carrier.dba}</div>}
                    <div className="text-[10px] text-slate-400">{carrier.city ? `${carrier.city}, ${carrier.state}` : "USA"}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div className="font-bold text-blue-600">{carrier.mcNumber}</div>
                    <div className="text-[10px] text-slate-400">DOT: {carrier.dotNumber || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {carrier.phone || "—"}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> {carrier.dispatchEmail || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div>Cargo: <strong>${carrier.insuranceCargoAmount?.toLocaleString()}</strong></div>
                    <div className="text-[10px] text-slate-500">Auto: ${carrier.insuranceAutoAmount?.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`flex items-center gap-0.5 ${carrier.coiOnFile ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                        <CheckCircle2 className="w-3 h-3" /> COI
                      </span>
                      <span className={`flex items-center gap-0.5 ${carrier.w9OnFile ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                        <CheckCircle2 className="w-3 h-3" /> W-9
                      </span>
                      <span className={`flex items-center gap-0.5 ${carrier.agreementOnFile ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                        <CheckCircle2 className="w-3 h-3" /> Agmt
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {carrier.paymentTerms.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {carrier.status}
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
