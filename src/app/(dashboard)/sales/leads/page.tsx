import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createLeadAction, createCustomerAction } from "@/app/actions/sales";
import {
  Briefcase,
  Plus,
  User,
  Phone,
  Mail,
  Building2,
  DollarSign,
  TrendingUp,
  Tag,
  ArrowRight,
  Filter
} from "lucide-react";

export default async function LeadsPage() {
  const user = await requireRole(["SUPER_ADMIN", "SALES_MANAGER", "SALES_AGENT"]);

  const [leads, customers, salesAgents] = await Promise.all([
    prisma.lead.findMany({
      include: {
        customer: true,
        salesAgent: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["SALES_AGENT", "SALES_MANAGER"] } },
      orderBy: { firstName: "asc" },
    }),
  ]);

  const stages = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" /> Sales CRM & Shipper Leads Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track shipper opportunities from initial contact through qualification and quoting.
          </p>
        </div>
      </div>

      {/* Action Modals / Create Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Create Lead Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600" /> Add New Sales Lead
          </h3>
          <form
            action={async (formData: FormData) => {
              "use server";
              await createLeadAction(formData);
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Company / Shipper</label>
                <input
                  name="companyName"
                  required
                  placeholder="e.g. Metro Produce Logistics"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Contact Person</label>
                <input
                  name="contactName"
                  required
                  placeholder="e.g. Brian Miller"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="bmiller@metroproduce.com"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  name="phone"
                  placeholder="+1 (555) 019-2831"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Lead Source</label>
                <select name="source" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                  <option value="COLD_CALL">Cold Call</option>
                  <option value="INBOUND">Inbound Inquiry</option>
                  <option value="REFERRAL">Customer Referral</option>
                  <option value="LOAD_BOARD">Load Board / DAT</option>
                  <option value="WEBSITE">Website</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Est. Value ($/mo)</label>
                <input
                  name="estimatedValue"
                  type="number"
                  placeholder="15000"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Assigned Agent</label>
                <select name="salesAgentId" defaultValue={user.id} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                  {salesAgents.map((a) => (
                    <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Operating Notes / Lanes</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Lanes, weekly volume, temperature requirements..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Save Sales Lead
            </button>
          </form>
        </div>

        {/* Create Direct Shipper Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" /> Create Shipper Master Account
          </h3>
          <form
            action={async (formData: FormData) => {
              "use server";
              await createCustomerAction(formData);
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Shipper Legal Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Apex Industrial Corp"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Payment Terms</label>
                <select name="paymentTerms" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                  <option value="NET_30">Net 30 Days</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_7">Net 7 Days</option>
                  <option value="QUICK_PAY">QuickPay (1.5% Discount)</option>
                  <option value="PREPAID">Prepaid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">City</label>
                <input name="city" placeholder="Dallas" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">State</label>
                <input name="state" placeholder="TX" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Credit Limit ($)</label>
                <input name="creditLimit" type="number" defaultValue="25000" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Billing Email (Invoices)</label>
                <input name="email" type="email" placeholder="ap@company.com" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Phone</label>
                <input name="phone" placeholder="+1 (555) 123-4567" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
            >
              <Building2 className="w-4 h-4" /> Save Shipper Account
            </button>
          </form>
        </div>
      </div>

      {/* Leads Pipeline List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Active Leads Register
          </h3>
          <span className="text-xs text-slate-500">{leads.length} Active Leads</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3">Lead #</th>
                <th className="px-4 py-3">Company / Contact</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Assigned Sales Agent</th>
                <th className="px-4 py-3">Est. Value</th>
                <th className="px-4 py-3">Pipeline Stage</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-blue-600">{lead.leadNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{lead.companyName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{lead.contactName}</span>
                      {lead.phone && <span>• {lead.phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                      {lead.source.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">
                      {lead.salesAgent ? `${lead.salesAgent.firstName} ${lead.salesAgent.lastName}` : "Unassigned"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    ${lead.estimatedValue?.toLocaleString() || "0"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lead.status === "WON"
                        ? "bg-emerald-100 text-emerald-800"
                        : lead.status === "QUALIFIED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {lead.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href="/sales/quotes"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg"
                    >
                      Build Quote <ArrowRight className="w-3 h-3" />
                    </a>
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
