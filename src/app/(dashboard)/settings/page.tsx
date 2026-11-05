import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  Settings,
  Shield,
  Building,
  History,
  Lock,
  Globe,
  Clock,
} from "lucide-react";

export default async function SettingsPage() {
  await requireRole(["SUPER_ADMIN"]);

  const [company, branches, auditLogs] = await Promise.all([
    prisma.company.findFirst(),
    prisma.branch.findMany(),
    prisma.auditLog.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" /> Company Settings & Security Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global business parameters, operational timezones, branch legal entities, and immutable system audit logs.
          </p>
        </div>
      </div>

      {/* Company Parameters Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" /> Corporate Entity Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Legal Entity Name</span>
            <span className="font-bold text-slate-900 text-sm">{company?.legalName || "Ace Legacy Services LLC"}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Operating Brand (DBA)</span>
            <span className="font-bold text-slate-900 text-sm">{company?.dba || "Ace Legacy Services"}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Federal Tax ID (EIN)</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{company?.taxId || "84-2938471"}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Motor Carrier (MC#)</span>
            <span className="font-mono font-bold text-blue-600 text-sm">{company?.mcNumber || "MC-1094821"}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">USDOT Number</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{company?.dotNumber || "USDOT-3928172"}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Corporate Currency</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{company?.defaultCurrency || "USD ($)"}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Headquarters Timezone</span>
            <span className="font-semibold text-slate-900 text-sm">{company?.timezone || "America/Chicago (Central)"}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Registered Branches</span>
            <span className="font-bold text-slate-900 text-sm">{branches.length} Operational Facilities</span>
          </div>
        </div>
      </div>

      {/* Immutable Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              Immutable System Audit Logs
            </h3>
            <p className="text-[11px] text-slate-500">Every sensitive permission, rate, status, and financial action is recorded permanently.</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">{auditLogs.length} Log Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70 text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Actor / User</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Audit Details / Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    {new Date(log.createdAt).toISOString().replace("T", " ").substring(0, 19)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {log.actorName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    {log.entity} {log.entityId ? `(#${log.entityId.substring(0, 8)}...)` : ""}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500 max-w-md truncate">
                    {log.newValue || log.oldValue || "—"}
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
