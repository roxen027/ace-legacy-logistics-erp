"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionUser } from "@/types";
import { logoutAction } from "@/app/actions/auth";
import {
  LayoutDashboard,
  Users,
  Clock,
  Briefcase,
  FileText,
  Truck,
  Car,
  Receipt,
  PiggyBank,
  FolderLock,
  CalendarCheck,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  ChevronRight,
  Shield,
  Layers,
  ArrowRightLeft,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[]; // If undefined, visible to all authenticated
  division?: "BROKERAGE" | "DISPATCH" | "SHARED";
  badge?: string;
}

interface NavSection {
  title: string;
  divisionScope?: "BROKERAGE" | "DISPATCH" | "SHARED";
  badgeText?: string;
  badgeStyle?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "General & People",
    divisionScope: "SHARED",
    items: [
      {
        name: "Executive Overview",
        href: "/",
        icon: LayoutDashboard,
        division: "SHARED",
      },
      {
        name: "Employees & HR",
        href: "/hr/employees",
        icon: Users,
        roles: ["SUPER_ADMIN", "HR_MANAGER"],
        division: "SHARED",
      },
      {
        name: "Attendance & Shifts",
        href: "/hr/attendance",
        icon: Clock,
        division: "SHARED",
      },
    ],
  },
  {
    title: "Freight Brokerage Division",
    divisionScope: "BROKERAGE",
    badgeText: "BROKERAGE",
    badgeStyle: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    items: [
      {
        name: "Sales Pipeline & Leads",
        href: "/sales/leads",
        icon: Briefcase,
        roles: ["SUPER_ADMIN", "SALES_MANAGER", "SALES_AGENT"],
        division: "BROKERAGE",
      },
      {
        name: "Quotes & Versions",
        href: "/sales/quotes",
        icon: FileText,
        roles: ["SUPER_ADMIN", "SALES_MANAGER", "SALES_AGENT", "OPERATIONS_MANAGER"],
        division: "BROKERAGE",
      },
      {
        name: "Brokerage Loads (TMS)",
        href: "/brokerage/loads",
        icon: Layers,
        roles: ["SUPER_ADMIN", "SALES_MANAGER", "OPERATIONS_MANAGER", "DISPATCHER", "ACCOUNTING_MANAGER", "ACCOUNTANT"],
        division: "BROKERAGE",
      },
      {
        name: "Motor Carriers & COI",
        href: "/brokerage/carriers",
        icon: Car,
        roles: ["SUPER_ADMIN", "OPERATIONS_MANAGER", "DISPATCHER", "ACCOUNTING_MANAGER", "ACCOUNTANT"],
        division: "BROKERAGE",
      },
      {
        name: "Shipper Receivables (AR)",
        href: "/accounting/receivables",
        icon: Receipt,
        roles: ["SUPER_ADMIN", "SALES_MANAGER", "ACCOUNTING_MANAGER", "ACCOUNTANT"],
        division: "BROKERAGE",
      },
      {
        name: "Carrier Payables (AP)",
        href: "/accounting/payables",
        icon: Receipt,
        roles: ["SUPER_ADMIN", "OPERATIONS_MANAGER", "ACCOUNTING_MANAGER", "ACCOUNTANT"],
        division: "BROKERAGE",
      },
    ],
  },
  {
    title: "Truck Dispatching Division",
    divisionScope: "DISPATCH",
    badgeText: "DISPATCH",
    badgeStyle: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    items: [
      {
        name: "Dispatch Clients",
        href: "/dispatch/clients",
        icon: Building2,
        roles: ["SUPER_ADMIN", "OPERATIONS_MANAGER", "DISPATCHER", "ACCOUNTING_MANAGER"],
        division: "DISPATCH",
      },
      {
        name: "Fleet & Trucks",
        href: "/dispatch/fleet",
        icon: Truck,
        roles: ["SUPER_ADMIN", "OPERATIONS_MANAGER", "DISPATCHER"],
        division: "DISPATCH",
      },
      {
        name: "Dispatched Loads",
        href: "/dispatch/loads",
        icon: Truck,
        roles: ["SUPER_ADMIN", "OPERATIONS_MANAGER", "DISPATCHER", "ACCOUNTING_MANAGER"],
        division: "DISPATCH",
      },
      {
        name: "Dispatch Fee Billing",
        href: "/accounting/dispatch-fees",
        icon: Receipt,
        roles: ["SUPER_ADMIN", "ACCOUNTING_MANAGER", "ACCOUNTANT"],
        division: "DISPATCH",
      },
    ],
  },
  {
    title: "Finance & Administration",
    divisionScope: "SHARED",
    items: [
      {
        name: "Commissions",
        href: "/accounting/commissions",
        icon: PiggyBank,
        roles: ["SUPER_ADMIN", "SALES_MANAGER", "SALES_AGENT", "DISPATCHER", "ACCOUNTING_MANAGER"],
        division: "SHARED",
      },
      {
        name: "Document Vault",
        href: "/documents",
        icon: FolderLock,
        division: "SHARED",
      },
      {
        name: "Tasks & Reminders",
        href: "/tasks",
        icon: CalendarCheck,
        division: "SHARED",
      },
      {
        name: "Reports & Analytics",
        href: "/reports",
        icon: BarChart3,
        roles: ["SUPER_ADMIN", "SALES_MANAGER", "OPERATIONS_MANAGER", "ACCOUNTING_MANAGER", "HR_MANAGER"],
        division: "SHARED",
      },
      {
        name: "Settings & Audit Log",
        href: "/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN"],
        division: "SHARED",
      },
    ],
  },
];

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [activeFilter, setActiveFilter] = useState<"ALL" | "BROKERAGE" | "DISPATCH">("ALL");

  const isItemVisible = (item: NavItem) => {
    if (!item.roles) return true;
    if (user.role === "SUPER_ADMIN") return true;
    return item.roles.includes(user.role);
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-white tracking-wide truncate">
              ACE LEGACY
            </div>
            <div className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase truncate">
              Logistics ERP / TMS
            </div>
          </div>
        </div>

        {/* Division Filter Switcher (Tabs) */}
        <div className="p-2.5 bg-slate-950/60 border-b border-slate-800/60">
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`py-1 rounded text-center transition-all ${
                activeFilter === "ALL"
                  ? "bg-slate-800 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("BROKERAGE")}
              className={`py-1 rounded text-center transition-all flex items-center justify-center gap-1 ${
                activeFilter === "BROKERAGE"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-blue-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Brokerage
            </button>
            <button
              onClick={() => setActiveFilter("DISPATCH")}
              className={`py-1 rounded text-center transition-all flex items-center justify-center gap-1 ${
                activeFilter === "DISPATCH"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-emerald-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Dispatch
            </button>
          </div>
        </div>

        {/* Navigation List - Grouped with Distinct Section Dividers */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin">
          {NAV_SECTIONS.map((section, idx) => {
            // Apply division filter
            if (activeFilter === "BROKERAGE" && section.divisionScope === "DISPATCH") {
              return null;
            }
            if (activeFilter === "DISPATCH" && section.divisionScope === "BROKERAGE") {
              return null;
            }

            const visibleSectionItems = section.items.filter(isItemVisible);
            if (visibleSectionItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {/* Section Header */}
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </span>
                  {section.badgeText && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${section.badgeStyle}`}
                    >
                      {section.badgeText}
                    </span>
                  )}
                </div>

                {/* Section Items */}
                <div className="space-y-0.5">
                  {visibleSectionItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                          isActive
                            ? item.division === "DISPATCH"
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                              : "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform ${
                              isActive
                                ? "text-white"
                                : item.division === "BROKERAGE"
                                ? "text-blue-400 group-hover:text-blue-300"
                                : item.division === "DISPATCH"
                                ? "text-emerald-400 group-hover:text-emerald-300"
                                : "text-slate-400 group-hover:text-white"
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.division === "BROKERAGE" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          )}
                          {item.division === "DISPATCH" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          )}
                          {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/30">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-medium">
                <Shield className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                {user.role.replace("_", " ")}
              </div>
            </div>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full py-1.5 px-3 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
