"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Truck,
  Building,
  ArrowUpRight,
  Receipt,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  Car,
} from "lucide-react";

interface DashboardDivisionViewProps {
  userRole: string;
  showMargins: boolean;
  // Brokerage metrics
  totalBrokerageLoads: number;
  activeBrokerageLoads: number;
  deliveredBrokerageLoads: number;
  totalBrokerageAR: number;
  totalCarrierAP: number;
  grossBrokerageMargin: number;
  recentBrokerageLoads: any[];
  // Dispatch metrics
  dispatchClientsCount: number;
  activeTrucksCount: number;
  dispatchedLoadsCount: number;
  totalDispatchFeeRevenue: number;
  recentDispatchLoads: any[];
  // Compliance
  activeCarriersCount: number;
  todayAttendanceCount: number;
}

export function DashboardDivisionView({
  userRole,
  showMargins,
  totalBrokerageLoads,
  activeBrokerageLoads,
  deliveredBrokerageLoads,
  totalBrokerageAR,
  totalCarrierAP,
  grossBrokerageMargin,
  recentBrokerageLoads,
  dispatchClientsCount,
  activeTrucksCount,
  dispatchedLoadsCount,
  totalDispatchFeeRevenue,
  recentDispatchLoads,
  activeCarriersCount,
  todayAttendanceCount,
}: DashboardDivisionViewProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "BROKERAGE" | "DISPATCH">("ALL");

  return (
    <div className="space-y-6">
      {/* Division Navigation Filter Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-lg border border-slate-200/60">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building className="w-3.5 h-3.5 text-slate-500" />
            Consolidated View (All Divisions)
          </button>

          <button
            onClick={() => setActiveTab("BROKERAGE")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "BROKERAGE"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Freight Brokerage Division
          </button>

          <button
            onClick={() => setActiveTab("DISPATCH")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "DISPATCH"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-emerald-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Truck Dispatching Division
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span>Decoupled Ledger Model:</span>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Brokerage Margin
          </span>
          <span className="text-slate-300">|</span>
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Dispatch % Fee
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DIVISION 1: FREIGHT BROKERAGE SECTION                                     */}
      {/* ========================================================================= */}
      {(activeTab === "ALL" || activeTab === "BROKERAGE") && (
        <section className="bg-slate-50/60 p-5 rounded-2xl border-2 border-blue-100 space-y-4">
          {/* Section Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    FREIGHT BROKERAGE OPERATIONS
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                    Gross Margin Accounting
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Model: Shipper Freight AR ($) − Carrier Freight AP ($) = Recognized Company Gross Margin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/sales/quotes"
                className="px-3 py-1.5 text-xs font-bold bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New Quote
              </Link>
              <Link
                href="/brokerage/loads"
                className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" /> Brokerage Load Board
              </Link>
            </div>
          </div>

          {/* Brokerage KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Active Loads</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{activeBrokerageLoads}</span>
                <span className="text-xs text-slate-500 font-medium">/ {totalBrokerageLoads} Total</span>
              </div>
              <div className="mt-1 text-[11px] text-blue-700 font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> {deliveredBrokerageLoads} Delivered & POD Pending
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Shipper AR Receivables</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                ${totalBrokerageAR.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 font-medium">
                Customer invoiced freight charges
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Carrier Payables (AP)</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <Car className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                ${totalCarrierAP.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 font-medium">
                Carrier settlements & freight bills
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Gross Brokerage Margin</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700">
                {showMargins
                  ? `$${grossBrokerageMargin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "Protected"}
              </div>
              <div className="mt-1 text-[11px] text-emerald-800 font-semibold">
                Net Profit = AR − Carrier Pay
              </div>
            </div>
          </div>

          {/* Brokerage Loads Operations Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Active Multi-Stop Brokerage Shipments
              </h3>
              <Link
                href="/brokerage/loads"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View All Loads <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/70">
                  <tr>
                    <th className="px-4 py-2.5">Load # / Ref</th>
                    <th className="px-4 py-2.5">Shipper / Customer</th>
                    <th className="px-4 py-2.5">Origin $\rightarrow$ Destination</th>
                    <th className="px-4 py-2.5">Carrier / Driver</th>
                    <th className="px-4 py-2.5">Execution Status</th>
                    {showMargins && <th className="px-4 py-2.5 text-right">Margin ($ / %)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {recentBrokerageLoads.map((load) => {
                    const origin = load.stops?.find((s: any) => s.stopType === "PICKUP");
                    const destination = load.stops?.find((s: any) => s.stopType === "DELIVERY");

                    return (
                      <tr key={load.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/brokerage/loads/${load.id}`} className="font-bold text-blue-600 hover:underline">
                            {load.loadNumber}
                          </Link>
                          <div className="text-[10px] text-slate-400">{load.customerRefNo || "No Ref#"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 truncate max-w-[140px]">{load.customer?.name}</div>
                          <div className="text-[10px] text-slate-400">{load.equipment?.replace(/_/g, " ")}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">
                            {origin ? `${origin.city}, ${origin.state}` : "TBD"} $\rightarrow$ {destination ? `${destination.city}, ${destination.state}` : "TBD"}
                          </div>
                          <div className="text-[10px] text-slate-400">{load.totalMiles} mi</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 truncate max-w-[130px]">
                            {load.carrier ? load.carrier.legalName : "Unassigned"}
                          </div>
                          <div className="text-[10px] text-slate-400">{load.driverName || "Driver TBD"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            load.executionStatus === "IN_TRANSIT"
                              ? "bg-amber-100 text-amber-800"
                              : load.executionStatus === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {load.executionStatus?.replace(/_/g, " ")}
                          </span>
                        </td>
                        {showMargins && (
                          <td className="px-4 py-3 text-right">
                            <div className="font-bold text-emerald-700">
                              +${load.grossMargin?.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-400">{load.marginPercent?.toFixed(1)}% margin</div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* DIVISION 2: TRUCK DISPATCHING SECTION                                     */}
      {/* ========================================================================= */}
      {(activeTab === "ALL" || activeTab === "DISPATCH") && (
        <section className="bg-slate-50/60 p-5 rounded-2xl border-2 border-emerald-100 space-y-4">
          {/* Section Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    TRUCK DISPATCHING OPERATIONS
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                    Service Fee Accounting
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Model: Contracted Service Fee (8% - 10%) recognized as Ace Legacy Revenue. Carrier gross freight is decoupled.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dispatch/fleet"
                className="px-3 py-1.5 text-xs font-bold bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" /> Fleet Roster
              </Link>
              <Link
                href="/dispatch/loads"
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Dispatched Loads Board
              </Link>
            </div>
          </div>

          {/* Dispatch KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Active Client Fleet</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Building2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{dispatchClientsCount}</span>
                <span className="text-xs text-slate-500 font-medium">Motor Carriers</span>
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled Dispatch Agreements
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Trucks Under Load</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Truck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{activeTrucksCount}</span>
                <span className="text-xs text-slate-500 font-medium">Active Units</span>
              </div>
              <div className="mt-1 text-[11px] text-blue-700 font-medium">
                {dispatchedLoadsCount} total loads dispatched
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Target RPM Threshold</span>
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                $2.65 / mi
              </div>
              <div className="mt-1 text-[11px] text-slate-500 font-medium">
                Fleet loaded rate-per-mile target
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Dispatch Fee Revenue</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-amber-800">
                ${totalDispatchFeeRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] text-amber-900 font-semibold">
                Recognized 8% - 10% Service Fees
              </div>
            </div>
          </div>

          {/* Dispatched Loads Queue */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Active Owner-Operator Dispatches
              </h3>
              <Link
                href="/dispatch/loads"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View All Dispatches <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentDispatchLoads.map((dLoad) => (
                <div
                  key={dLoad.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{dLoad.dispatchNumber}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Fee: ${dLoad.calculatedFee?.toFixed(2)} ({dLoad.feeRate}%)
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-800 font-bold truncate">
                    {dLoad.client?.companyName} <span className="text-slate-400 font-normal">({dLoad.truck?.unitNumber})</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
                    <span>{dLoad.originCity}, {dLoad.originState} $\rightarrow$ {dLoad.destCity}, {dLoad.destState}</span>
                    <span className="font-mono font-bold text-slate-900">${dLoad.grossFreightRate?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compliance & Corporate Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vetted Motor Carriers</div>
            <div className="text-xl font-black text-slate-900 mt-1">{activeCarriersCount} Approved</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Staff Clock-ins</div>
            <div className="text-xl font-black text-slate-900 mt-1">{todayAttendanceCount} Employees Active</div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Divisions</div>
            <div className="text-xl font-black text-slate-900 mt-1">Brokerage + Dispatch</div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
