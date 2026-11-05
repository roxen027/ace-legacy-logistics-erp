import { requireRole, canViewBrokerageMargin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  assignCarrierToLoadAction,
  updateLoadMilestoneAction,
  verifyPodDocumentAction,
} from "@/app/actions/brokerage";
import { AiDocumentParserModal } from "@/components/ai/AiDocumentParserModal";
import { AiCheckCallModal } from "@/components/ai/AiCheckCallModal";
import { AiPodAuditModal } from "@/components/ai/AiPodAuditModal";
import Link from "next/link";
import {
  Layers,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  FileCheck,
  Building,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Filter,
} from "lucide-react";

export default async function BrokerageLoadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const user = await requireRole([
    "SUPER_ADMIN",
    "SALES_MANAGER",
    "OPERATIONS_MANAGER",
    "DISPATCHER",
    "ACCOUNTING_MANAGER",
    "ACCOUNTANT",
  ]);

  const params = await searchParams;
  const statusFilter = params.status;
  const searchQuery = params.search?.toLowerCase();
  const showMargins = canViewBrokerageMargin(user);

  const [loads, vettedCarriers] = await Promise.all([
    prisma.brokerageLoad.findMany({
      where: {
        ...(statusFilter && statusFilter !== "ALL" ? { executionStatus: statusFilter } : {}),
        ...(searchQuery
          ? {
              OR: [
                { loadNumber: { contains: searchQuery } },
                { customerRefNo: { contains: searchQuery } },
                { customer: { name: { contains: searchQuery } } },
                { carrier: { legalName: { contains: searchQuery } } },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        carrier: true,
        stops: { orderBy: { stopSequence: "asc" } },
        events: { orderBy: { createdAt: "desc" }, take: 2 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.carrier.findMany({
      where: { status: "ACTIVE" },
      orderBy: { legalName: "asc" },
    }),
  ]);

  const statusTabs = [
    { label: "All Loads", value: "ALL" },
    { label: "Pending Coverage", value: "PENDING_DISPATCH" },
    { label: "Dispatched", value: "DISPATCHED" },
    { label: "In Transit", value: "IN_TRANSIT" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "POD Verified", value: "POD_VERIFIED" },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> Freight Brokerage Load Board (TMS)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end execution: carrier sourcing, appointment scheduling, live tracking, and POD collection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AiDocumentParserModal defaultDivision="BROKERAGE" />
          <Link
            href="/brokerage/carriers"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300/80 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Carrier Compliance Directory
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
        {statusTabs.map((tab) => {
          const isActive = (!statusFilter && tab.value === "ALL") || statusFilter === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/brokerage/loads?status=${tab.value}`}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Loads Cards Grid */}
      <div className="space-y-4">
        {loads.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            No brokerage loads found matching the selected filter criteria.
          </div>
        ) : (
          loads.map((load) => {
            const origin = load.stops.find((s) => s.stopType === "PICKUP");
            const destination = load.stops.find((s) => s.stopType === "DELIVERY");

            return (
              <div
                key={load.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden hover:border-blue-300 transition-all"
              >
                {/* Header */}
                <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm text-blue-600">
                      {load.loadNumber}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-xs font-bold text-slate-900">{load.customer.name}</span>
                    {load.customerRefNo && (
                      <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-mono">
                        {load.customerRefNo}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Coverage Status */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      load.coverageStatus === "COVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      Coverage: {load.coverageStatus}
                    </span>

                    {/* Execution Status */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      load.executionStatus === "DELIVERED" || load.executionStatus === "POD_VERIFIED"
                        ? "bg-emerald-100 text-emerald-800"
                        : load.executionStatus === "IN_TRANSIT"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {load.executionStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                  {/* Left: Stops Route */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        <div className="w-0.5 h-8 bg-slate-200 my-0.5"></div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      </div>

                      <div className="space-y-3 flex-1 min-w-0">
                        {/* Origin Stop */}
                        <div>
                          <div className="font-bold text-slate-900 truncate">
                            {origin?.facilityName || "Shipper Origin"} ({origin?.city}, {origin?.state})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Appt: {origin ? new Date(origin.apptWindowStart).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBD"} • {origin?.timezone}
                          </div>
                        </div>

                        {/* Destination Stop */}
                        <div>
                          <div className="font-bold text-slate-900 truncate">
                            {destination?.facilityName || "Consignee"} ({destination?.city}, {destination?.state})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Appt: {destination ? new Date(destination.apptWindowStart).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBD"} • {destination?.timezone}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-3">
                      <span>Equip: <strong>{load.equipment.replace(/_/g, " ")}</strong></span>
                      <span>Weight: <strong>{load.weightLbs ? `${load.weightLbs.toLocaleString()} lbs` : "42k"}</strong></span>
                      <span>Miles: <strong>{load.totalMiles} mi</strong></span>
                    </div>
                  </div>

                  {/* Middle: Carrier Assignment Details */}
                  <div className="lg:col-span-4 bg-slate-50/50 p-3.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-blue-600" /> Assigned Motor Carrier
                    </div>
                    {load.carrier ? (
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900">{load.carrier.legalName}</div>
                        <div className="text-[11px] text-slate-600 font-mono">
                          {load.carrier.mcNumber} • DOT {load.carrier.dotNumber || "—"}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Driver: {load.driverName || "Assigned"} ({load.driverPhone || "No Phone"})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Truck: {load.truckNumber || "—"} | Trailer: {load.trailerNumber || "—"}
                        </div>
                      </div>
                    ) : (
                      <div className="py-2">
                        <p className="text-[11px] text-amber-700 font-semibold mb-2">
                          No carrier contracted yet. Assign a carrier below:
                        </p>
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            const carrierId = formData.get("carrierId") as string;
                            const carrierRate = parseFloat(formData.get("carrierRate") as string || "0");
                            const driverName = formData.get("driverName") as string;
                            const driverPhone = formData.get("driverPhone") as string;
                            await assignCarrierToLoadAction(load.id, carrierId, carrierRate, driverName, driverPhone);
                          }}
                          className="space-y-2"
                        >
                          <select name="carrierId" required className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs">
                            <option value="">Select Vetted Carrier...</option>
                            {vettedCarriers.map((c) => (
                              <option key={c.id} value={c.id}>{c.legalName} ({c.mcNumber})</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input name="carrierRate" type="number" required placeholder="Carrier Pay $" className="p-1.5 bg-white border border-slate-200 rounded text-xs font-bold" />
                            <input name="driverName" placeholder="Driver Name" className="p-1.5 bg-white border border-slate-200 rounded text-xs" />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs"
                          >
                            Sign Rate Con & Cover
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Right: Financials & Operational Controls */}
                  <div className="lg:col-span-3 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Freight Rates & Spread
                      </div>
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-slate-500">Customer Rate:</span>
                        <span className="font-bold text-slate-900">${load.customerRate.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-mono text-xs mt-0.5">
                        <span className="text-slate-500">Carrier Pay:</span>
                        <span className="font-bold text-slate-900">${load.carrierRate.toFixed(2)}</span>
                      </div>
                      {showMargins && (
                        <div className="flex justify-between font-mono text-xs mt-1 pt-1 border-t border-slate-100">
                          <span className="font-semibold text-emerald-800">Gross Margin:</span>
                          <span className="font-bold text-emerald-700">
                            +${load.grossMargin.toFixed(2)} ({load.marginPercent.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Milestone Progression Buttons & AI Check-Call */}
                    <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                      {load.carrier && load.executionStatus !== "POD_VERIFIED" && load.executionStatus !== "CANCELLED" && (
                        <div className="mb-1">
                          <AiCheckCallModal
                            loadId={load.id}
                            loadNumber={load.loadNumber}
                            driverName={load.driverName || undefined}
                            division="BROKERAGE"
                          />
                        </div>
                      )}

                      {load.executionStatus === "DISPATCHED" && (
                        <form action={async () => {
                          "use server";
                          await updateLoadMilestoneAction(load.id, "IN_TRANSIT", "En Route", "Driver rolling");
                        }}>
                          <button
                            type="submit"
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Clock className="w-3.5 h-3.5" /> Mark In Transit
                          </button>
                        </form>
                      )}

                      {load.executionStatus === "IN_TRANSIT" && (
                        <form action={async () => {
                          "use server";
                          await updateLoadMilestoneAction(load.id, "DELIVERED", "Consignee Dock", "Unloaded clean");
                        }}>
                          <button
                            type="submit"
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded flex items-center justify-center gap-1 shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Confirm Delivered
                          </button>
                        </form>
                      )}

                      {load.executionStatus === "DELIVERED" && (
                        <AiPodAuditModal
                          loadId={load.id}
                          loadNumber={load.loadNumber}
                          customerName={load.customer.name}
                          carrierName={load.carrier?.legalName || "Contracted Carrier"}
                          agreedRate={load.carrierRate}
                        />
                      )}

                      {load.executionStatus === "POD_VERIFIED" && (
                        <div className="text-center py-1 text-[11px] font-bold text-purple-700 bg-purple-50 rounded border border-purple-200">
                          POD Verified & Invoiced
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
