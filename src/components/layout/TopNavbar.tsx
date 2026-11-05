"use client";

import { useState } from "react";
import { SessionUser, UserRole } from "@/types";
import { fastLoginAction } from "@/app/actions/auth";
import { AiCopilotDrawer } from "@/components/copilot/AiCopilotDrawer";
import {
  Search,
  Bell,
  Clock,
  Building,
  Truck,
  Layers,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function TopNavbar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDivision, setActiveDivision] = useState<"ALL" | "BROKERAGE" | "DISPATCH">("ALL");
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Route to global search or brokerage loads
    router.push(`/brokerage/loads?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleRoleSwitch = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    if (newRole && newRole !== user.role) {
      setIsSwitching(true);
      await fastLoginAction(newRole);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
      {/* Left: Division Context Selector & Search Bar */}
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        {/* Division Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveDivision("ALL")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeDivision === "ALL"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building className="w-3.5 h-3.5" /> All Company
          </button>
          <button
            onClick={() => setActiveDivision("BROKERAGE")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeDivision === "BROKERAGE"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Brokerage
          </button>
          <button
            onClick={() => setActiveDivision("DISPATCH")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeDivision === "DISPATCH"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-emerald-700"
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Dispatch
          </button>
        </div>

        {/* Global Search */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search load #, quote, customer, carrier MC#..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all"
          />
        </form>
      </div>

      {/* Right: Role Switcher & Clock & Notification */}
      <div className="flex items-center gap-4">
        {/* Instant Role Preview Switcher */}
        <div className="flex items-center gap-2 bg-slate-100/90 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-slate-700" />
          <span className="text-[11px] font-semibold text-slate-600">Portal View:</span>
          <select
            value={user.role}
            onChange={handleRoleSwitch}
            disabled={isSwitching}
            className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer tracking-tight"
          >
            <option value="SUPER_ADMIN">Super Admin / Owner</option>
            <option value="SALES_MANAGER">Sales Manager</option>
            <option value="SALES_AGENT">Sales Agent</option>
            <option value="OPERATIONS_MANAGER">Operations Manager</option>
            <option value="DISPATCHER">Lead Dispatcher</option>
            <option value="ACCOUNTING_MANAGER">Accounting Manager</option>
            <option value="ACCOUNTANT">Billing Accountant</option>
            <option value="HR_MANAGER">HR & People Manager</option>
          </select>
        </div>

        {/* Global AI Command Copilot Drawer */}
        <AiCopilotDrawer />

        {/* Operational Time Badge */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>US Central (HQ): {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Chicago" })}</span>
        </div>

        {/* Notifications */}
        <button
          title="Notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
}
