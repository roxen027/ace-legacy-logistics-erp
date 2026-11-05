import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Truck,
  DollarSign,
  Download,
  Calendar,
  Layers,
  Building,
  CheckCircle2,
} from "lucide-react";

export default async function ReportsPage() {
  await requireRole([
    "SUPER_ADMIN",
    "SALES_MANAGER",
    "OPERATIONS_MANAGER",
    "ACCOUNTING_MANAGER",
    "HR_MANAGER",
  ]);

  const [brokerageLoads, dispatchLoads, invoices, payables] = await Promise.all([
    prisma.brokerageLoad.findMany({
      include: { customer: true, carrier: true },
    }),
    prisma.dispatchLoad.findMany({
      include: { client: true, truck: true },
    }),
    prisma.invoice.findMany(),
    prisma.carrierPayable.findMany(),
  ]);

  // Brokerage Totals
  const brokerageFreightBilled = brokerageLoads.reduce((sum, l) => sum + l.customerRate, 0);
  const brokerageCarrierCost = brokerageLoads.reduce((sum, l) => sum + l.carrierRate, 0);
  const brokerageGrossMargin = brokerageLoads.reduce((sum, l) => sum + l.grossMargin, 0);
  const avgMarginPercent =
    brokerageFreightBilled > 0 ? (brokerageGrossMargin / brokerageFreightBilled) * 100 : 0;

  // Dispatch Totals (Revenue = Fee only)
  const dispatchCarrierGrossFreight = dispatchLoads.reduce((sum, l) => sum + l.grossFreightRate, 0);
  const dispatchServiceFeeRevenue = dispatchLoads.reduce((sum, l) => sum + l.calculatedFee, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> Executive Financial & Operational Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconciled division ledgers distinguishing Brokerage Gross Margins from Dispatch Service Fee Revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/reports/export"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export Report (CSV)
          </a>
        </div>
      </div>

      {/* Division Reconciliation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Freight Brokerage Division P&L Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Freight Brokerage Division Ledger
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              {brokerageLoads.length} Shipments
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 font-mono">
              <span className="text-slate-600">Total Customer Freight Invoiced (AR):</span>
              <span className="font-bold text-slate-900">
                ${brokerageFreightBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 font-mono">
              <span className="text-slate-600">Contracted Carrier Freight Costs (AP):</span>
              <span className="font-bold text-slate-700">
                -${brokerageCarrierCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 bg-blue-50/70 p-3 rounded-lg font-mono text-sm">
              <span className="font-bold text-blue-950">Brokerage Gross Margin:</span>
              <span className="font-black text-emerald-700">
                +${brokerageGrossMargin.toLocaleString("en-US", { minimumFractionDigits: 2 })} ({avgMarginPercent.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-400">
            Note: Brokerage gross margin represents customer freight minus carrier cost. Corporate overhead and payroll are deducted on corporate income statements.
          </div>
        </div>

        {/* Truck Dispatching Division P&L Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Truck Dispatching Division Ledger
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
              {dispatchLoads.length} Dispatched Loads
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 font-mono">
              <span className="text-slate-600">Sourced Motor Carrier Gross Freight:</span>
              <span className="font-bold text-slate-900">
                ${dispatchCarrierGrossFreight.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 font-mono">
              <span className="text-slate-600">Contracted Service Fee Average:</span>
              <span className="font-bold text-emerald-700">8.00%</span>
            </div>

            <div className="flex justify-between items-center py-2 bg-emerald-50/70 p-3 rounded-lg font-mono text-sm">
              <span className="font-bold text-emerald-950">Ace Dispatch Fee Revenue:</span>
              <span className="font-black text-emerald-700">
                +${dispatchServiceFeeRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-400">
            Crucial Accounting Boundary: Sourced carrier gross freight is collected directly by motor carriers and is <strong>never</strong> recorded as Ace Legacy Services company revenue.
          </div>
        </div>
      </div>
    </div>
  );
}
