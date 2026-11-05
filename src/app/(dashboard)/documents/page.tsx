import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AiDocumentParserModal } from "@/components/ai/AiDocumentParserModal";
import {
  FolderLock,
  FileText,
  FileCheck,
  ShieldCheck,
  Car,
  Download,
  Eye,
  Calendar,
} from "lucide-react";

export default async function DocumentsPage() {
  await requireAuth();

  // Aggregate document records from loads, carriers, and quotes
  const [brokerageLoads, carriers] = await Promise.all([
    prisma.brokerageLoad.findMany({
      where: {
        OR: [
          { rateConSignedUrl: { not: null } },
          { podDocumentUrl: { not: null } },
        ],
      },
      include: { customer: true, carrier: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.carrier.findMany({
      include: { documents: true },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-blue-600" /> Compliance & Document Repository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized repository for signed Rate Confirmations, Proof of Delivery (PODs), COIs, and tax forms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AiDocumentParserModal defaultDivision="BROKERAGE" />
        </div>
      </div>

      {/* Categories Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <FileText className="w-4 h-4 text-blue-600" /> Rate Confirmations
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {brokerageLoads.filter((l) => l.rateConSignedUrl).length} Files
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Signed tender contracts</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <FileCheck className="w-4 h-4 text-emerald-600" /> Proof of Delivery (POD)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {brokerageLoads.filter((l) => l.podDocumentUrl).length} Verified
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Clean signed BOLs & receipts</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <ShieldCheck className="w-4 h-4 text-purple-600" /> Insurance COIs
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {carriers.filter((c) => c.coiOnFile).length} On File
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Auto Liability & Cargo policies</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <Car className="w-4 h-4 text-amber-600" /> W-9 Tax Forms
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {carriers.filter((c) => c.w9OnFile).length} Validated
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Carrier federal tax documents</div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Active Shipment & Compliance Documents
          </h3>
          <span className="text-xs text-slate-500">Secure Access Enforced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-4 py-3">Document Type</th>
                <th className="px-4 py-3">Reference / Number</th>
                <th className="px-4 py-3">Related Party</th>
                <th className="px-4 py-3">Uploaded Date</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {brokerageLoads.map((load) => (
                <tr key={load.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <FileText className="w-3 h-3" /> Signed Rate Confirmation
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    RC-{load.loadNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{load.carrier?.legalName || "Assigned Carrier"}</div>
                    <div className="text-[10px] text-slate-400">Shipper: {load.customer.name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(load.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </a>
                  </td>
                </tr>
              ))}

              {brokerageLoads
                .filter((l) => l.podDocumentUrl)
                .map((load) => (
                  <tr key={`pod-${load.id}`} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <FileCheck className="w-3 h-3" /> Proof of Delivery (POD)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      POD-{load.loadNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{load.customer.name}</div>
                      <div className="text-[10px] text-slate-400">Carrier: {load.carrier?.legalName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(load.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <ShieldCheck className="w-3 h-3" /> Clean POD
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href="#"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded"
                      >
                        <Download className="w-3 h-3" /> Download
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
