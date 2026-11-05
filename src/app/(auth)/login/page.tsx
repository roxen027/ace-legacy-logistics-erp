"use client";

import { useActionState, useState } from "react";
import { loginAction, fastLoginAction } from "@/app/actions/auth";
import { UserRole } from "@/types";
import { 
  ShieldCheck, 
  Truck, 
  Briefcase, 
  UserCheck, 
  Calculator, 
  Layers, 
  Compass, 
  ArrowRight, 
  Lock, 
  Mail,
  Loader2
} from "lucide-react";

const DEMO_ROLES: { role: UserRole; title: string; email: string; name: string; icon: any; color: string }[] = [
  {
    role: "SUPER_ADMIN",
    title: "Super Admin / Owner",
    email: "admin@acelegacyservices.com",
    name: "Marcus Sterling",
    icon: ShieldCheck,
    color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
  },
  {
    role: "SALES_MANAGER",
    title: "Sales Manager",
    email: "sales.manager@acelegacyservices.com",
    name: "David Vance",
    icon: Briefcase,
    color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  },
  {
    role: "SALES_AGENT",
    title: "Sales Agent",
    email: "sales.agent@acelegacyservices.com",
    name: "Jordan Miller",
    icon: Compass,
    color: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100",
  },
  {
    role: "OPERATIONS_MANAGER",
    title: "Operations Manager",
    email: "ops.manager@acelegacyservices.com",
    name: "Caleb Brooks",
    icon: Layers,
    color: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
  },
  {
    role: "DISPATCHER",
    title: "Lead Dispatcher",
    email: "dispatcher@acelegacyservices.com",
    name: "Travis Holt",
    icon: Truck,
    color: "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100",
  },
  {
    role: "ACCOUNTING_MANAGER",
    title: "Accounting Manager",
    email: "accounting.manager@acelegacyservices.com",
    name: "Sophia Chen",
    icon: Calculator,
    color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
  },
  {
    role: "ACCOUNTANT",
    title: "Billing Accountant",
    email: "accountant@acelegacyservices.com",
    name: "Lucas Wright",
    icon: Calculator,
    color: "bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100",
  },
  {
    role: "HR_MANAGER",
    title: "HR & People Manager",
    email: "hr@acelegacyservices.com",
    name: "Elena Rios",
    icon: UserCheck,
    color: "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100",
  },
];

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  const handleFastLogin = async (role: UserRole) => {
    try {
      setSwitchingRole(role);
      await fastLoginAction(role);
    } catch (err) {
      console.error(err);
      setSwitchingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-4">
          <Truck className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          ACE LEGACY SERVICES
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Freight Brokerage & Truck Dispatching ERP System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4 sm:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-100">
          
          {/* Left Column: Direct Credentials Login */}
          <div className="lg:col-span-5 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100">
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Sign in to your account</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your corporate credentials to access your designated workspace.
                </p>
              </div>

              {state?.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <span className="font-semibold">Error:</span> {state.error}
                </div>
              )}

              <form action={formAction} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      name="email"
                      type="email"
                      defaultValue="admin@acelegacyservices.com"
                      required
                      placeholder="name@acelegacyservices.com"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      name="password"
                      type="password"
                      defaultValue="admin123"
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                    </>
                  ) : (
                    <>
                      Sign In to Workspace <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Default password for seeded accounts: <code className="text-slate-700 font-mono font-bold">admin123</code>
              </p>
            </div>
          </div>

          {/* Right Column: Quick Role Switcher for Testing Portals */}
          <div className="lg:col-span-7 p-8 bg-slate-50/70">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Instant Role Portal Testing
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any role to test its specific permissions, workflows, and access boundaries:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_ROLES.map((r) => {
                const IconComponent = r.icon;
                const isSelected = switchingRole === r.role;

                return (
                  <button
                    key={r.role}
                    onClick={() => handleFastLogin(r.role)}
                    disabled={!!switchingRole}
                    className={`flex items-start p-3 text-left border rounded-xl transition-all shadow-sm ${r.color} ${
                      isSelected ? "ring-2 ring-blue-600 opacity-90 scale-[0.98]" : "hover:shadow"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-white/80 mr-3 shadow-xs shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs leading-snug truncate">{r.title}</div>
                      <div className="text-[11px] opacity-80 truncate">{r.name}</div>
                      <div className="text-[10px] opacity-60 font-mono truncate">{r.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 p-3 rounded-lg bg-blue-50/80 border border-blue-100 text-[11px] text-blue-900">
              <span className="font-semibold">Security Note:</span> Role-based access control (RBAC) is strictly validated on the server API and database queries, guaranteeing that agents only access authorized accounts and data.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
