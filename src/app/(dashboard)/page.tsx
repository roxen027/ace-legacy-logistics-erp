import { requireAuth, canViewBrokerageMargin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Truck,
  Layers,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { DashboardDivisionView } from "@/components/dashboard/DashboardDivisionView";

export default async function DashboardPage() {
  const user = await requireAuth();
  const showMargins = canViewBrokerageMargin(user);

  // Fetch real-time operational aggregates from database
  const [
    totalBrokerageLoads,
    activeBrokerageLoads,
    deliveredBrokerageLoads,
    dispatchClientsCount,
    activeTrucksCount,
    dispatchedLoadsCount,
    activeCarriersCount,
    todayAttendanceCount,
    recentBrokerageLoads,
    recentDispatchLoads,
    invoices,
    carrierPayables,
  ] = await Promise.all([
    prisma.brokerageLoad.count(),
    prisma.brokerageLoad.count({
      where: { executionStatus: { in: ["PENDING_DISPATCH", "DISPATCHED", "AT_PICKUP", "IN_TRANSIT"] } },
    }),
    prisma.brokerageLoad.count({
      where: { executionStatus: { in: ["DELIVERED", "POD_VERIFIED"] } },
    }),
    prisma.dispatchClient.count({ where: { status: "ACTIVE" } }),
    prisma.truck.count({ where: { status: "UNDER_LOAD" } }),
    prisma.dispatchLoad.count(),
    prisma.carrier.count({ where: { status: "ACTIVE" } }),
    prisma.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.brokerageLoad.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        carrier: true,
        stops: { orderBy: { stopSequence: "asc" } },
      },
    }),
    prisma.dispatchLoad.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        truck: true,
        driver: true,
      },
    }),
    prisma.invoice.findMany(),
    prisma.carrierPayable.findMany(),
  ]);

  // Financial Calculations (Decoupled Division Accounting)
  const brokerageInvoices = invoices.filter((i) => i.division === "BROKERAGE");
  const dispatchInvoices = invoices.filter((i) => i.division === "DISPATCH");

  const totalBrokerageAR = brokerageInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCarrierAP = carrierPayables.reduce((sum, ap) => sum + ap.totalDue, 0);
  const totalDispatchFeeRevenue = dispatchInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Brokerage Gross Margin = Customer Freight Rate - Contracted Carrier Cost
  const grossBrokerageMargin = recentBrokerageLoads.reduce((sum, load) => sum + load.grossMargin, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {user.role.replace(/_/g, " ")} Workspace
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">
            Welcome back, {user.firstName}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Ace Legacy Services operational command center. Decoupled operations for Freight Brokerage and Truck Dispatching divisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sales/quotes"
            className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" /> Create Quote
          </Link>
          <Link
            href="/brokerage/loads"
            className="px-3.5 py-2 text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" /> Brokerage Loads
          </Link>
          <Link
            href="/dispatch/loads"
            className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4" /> Dispatch Load
          </Link>
        </div>
      </div>

      {/* Decoupled Interactive Division View */}
      <DashboardDivisionView
        userRole={user.role}
        showMargins={showMargins}
        totalBrokerageLoads={totalBrokerageLoads}
        activeBrokerageLoads={activeBrokerageLoads}
        deliveredBrokerageLoads={deliveredBrokerageLoads}
        totalBrokerageAR={totalBrokerageAR}
        totalCarrierAP={totalCarrierAP}
        grossBrokerageMargin={grossBrokerageMargin}
        recentBrokerageLoads={recentBrokerageLoads}
        dispatchClientsCount={dispatchClientsCount}
        activeTrucksCount={activeTrucksCount}
        dispatchedLoadsCount={dispatchedLoadsCount}
        totalDispatchFeeRevenue={totalDispatchFeeRevenue}
        recentDispatchLoads={recentDispatchLoads}
        activeCarriersCount={activeCarriersCount}
        todayAttendanceCount={todayAttendanceCount}
      />
    </div>
  );
}
