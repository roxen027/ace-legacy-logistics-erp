"use client";

import { useState, useEffect } from "react";
import { getCopilotBriefAction } from "@/app/actions/ai";
import { CopilotRoleBrief } from "@/lib/ai/types";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Truck,
  DollarSign,
  ShieldAlert,
  Loader2,
  Zap,
} from "lucide-react";

export function AiCopilotDrawer() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [brief, setBrief] = useState<CopilotRoleBrief | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBrief = async () => {
    setIsLoading(true);
    try {
      const res = await getCopilotBriefAction();
      setBrief(res);
    } catch (e) {
      console.error("Failed to load Copilot data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !brief) {
      fetchBrief();
    }
  }, [isOpen]);

  const handleActionClick = (targetUrl?: string) => {
    if (targetUrl) {
      router.push(targetUrl);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Navbar Trigger Pill */}
      <button
        onClick={() => {
          setIsOpen(true);
          fetchBrief();
        }}
        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all animate-pulse"
      >
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
        <span className="hidden sm:inline">AI Copilot</span>
      </button>

      {/* Floating Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide flex items-center gap-1.5">
                    ACE COPILOT
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-400/30">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 truncate">
                    Role-Aware Operational Intelligence
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
              {isLoading ? (
                <div className="py-20 text-center text-slate-400 space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <p className="font-semibold text-xs">Analyzing Real-time ERP Data...</p>
                </div>
              ) : brief ? (
                <>
                  {/* Headline Alert */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    brief.urgencyLevel === "CRITICAL"
                      ? "bg-red-50 border-red-200 text-red-900"
                      : brief.urgencyLevel === "ATTENTION"
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-blue-50 border-blue-200 text-blue-900"
                  }`}>
                    <Zap className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-75">
                        {brief.role.replace(/_/g, " ")} Summary
                      </span>
                      <p className="font-bold text-xs mt-0.5 leading-snug">{brief.headline}</p>
                    </div>
                  </div>

                  {/* Key Real-Time Metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    {brief.keyMetrics.map((km, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block truncate">
                          {km.label}
                        </span>
                        <span className="font-black text-slate-900 text-sm mt-1 block truncate">
                          {km.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Live Operational Insights */}
                  <div className="space-y-2">
                    <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                      Live Operational Insights
                    </span>
                    <div className="space-y-1.5">
                      {brief.insights.map((ins, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                          <span className="leading-relaxed">{ins}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended 1-Click Action Chips */}
                  <div className="space-y-2">
                    <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                      Recommended 1-Click Actions
                    </span>
                    <div className="space-y-2">
                      {brief.recommendedActions.map((act) => (
                        <button
                          key={act.id}
                          onClick={() => handleActionClick(act.targetUrl)}
                          className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 shadow-xs hover:shadow transition-all text-left flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1.5">
                              {act.label}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {act.description}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  Click refresh to query live ERP metrics.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ace Intelligence Active
              </span>
              <button
                onClick={fetchBrief}
                className="font-bold text-blue-600 hover:text-blue-800"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
