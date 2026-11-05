"use client";

import { useState } from "react";
import { aiRankFleetForLoadAction } from "@/app/actions/ai";
import { createDispatchLoadAction } from "@/app/actions/dispatch";
import { FleetMatchResult } from "@/lib/ai/types";
import {
  Sparkles,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  DollarSign,
  TrendingUp,
  MapPin,
} from "lucide-react";

export function AiFleetMatcherModal({
  defaultOriginCity = "Dallas",
  defaultOriginState = "TX",
  defaultDestCity = "St. Louis",
  defaultDestState = "MO",
  defaultLoadedMiles = 630,
  defaultGrossRate = 2200,
  defaultTrailer = "DRY_VAN",
}: {
  defaultOriginCity?: string;
  defaultOriginState?: string;
  defaultDestCity?: string;
  defaultDestState?: string;
  defaultLoadedMiles?: number;
  defaultGrossRate?: number;
  defaultTrailer?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [originCity, setOriginCity] = useState(defaultOriginCity);
  const [originState, setOriginState] = useState(defaultOriginState);
  const [destCity, setDestCity] = useState(defaultDestCity);
  const [destState, setDestState] = useState(defaultDestState);
  const [loadedMiles, setLoadedMiles] = useState(defaultLoadedMiles);
  const [grossRate, setGrossRate] = useState(defaultGrossRate);
  const [trailerType, setTrailerType] = useState(defaultTrailer);

  const [isRanking, setIsRanking] = useState(false);
  const [rankedList, setRankedList] = useState<FleetMatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleRank = async () => {
    setIsRanking(true);
    setError(null);
    try {
      const res = await aiRankFleetForLoadAction({
        originCity,
        originState,
        destCity,
        destState,
        loadedMiles,
        grossRate,
        trailerType,
      });
      if (res.success && res.ranked) {
        setRankedList(res.ranked);
      }
    } catch (err: any) {
      setError(err.message || "Failed to rank fleet for load.");
    } finally {
      setIsRanking(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          handleRank();
        }}
        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> AI Fleet Matcher & Profit Analyzer
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Truck className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    AI Fleet Matcher & Profit Optimization Analyzer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Matches spot loads against owner-operator units based on equipment, deadhead, target RPM, and net profit.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Parameters */}
            <div className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Origin</label>
                  <div className="flex gap-1">
                    <input
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                    />
                    <input
                      value={originState}
                      onChange={(e) => setOriginState(e.target.value.toUpperCase())}
                      maxLength={2}
                      className="w-12 p-1.5 bg-white border border-slate-200 rounded text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Destination</label>
                  <div className="flex gap-1">
                    <input
                      value={destCity}
                      onChange={(e) => setDestCity(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                    />
                    <input
                      value={destState}
                      onChange={(e) => setDestState(e.target.value.toUpperCase())}
                      maxLength={2}
                      className="w-12 p-1.5 bg-white border border-slate-200 rounded text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Loaded Miles / Gross Pay</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={loadedMiles}
                      onChange={(e) => setLoadedMiles(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="number"
                      value={grossRate}
                      onChange={(e) => setGrossRate(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleRank}
                    disabled={isRanking}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {isRanking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Re-Analyze Fleet
                  </button>
                </div>
              </div>

              {/* Ranked Fleet Units */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <span>Ranked Fleet Candidates ({rankedList.length} Units)</span>
                  <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Calculated with Ace Legacy 8.0% Dispatch Fee
                  </span>
                </div>

                <div className="space-y-2">
                  {rankedList.map((match, idx) => (
                    <div
                      key={match.truckId}
                      className={`p-4 rounded-xl border transition-all ${
                        idx === 0
                          ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/30"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900">
                              Unit {match.unitNumber}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {match.clientName} ({match.trailerType.replace(/_/g, " ")})
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              match.score >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                            }`}>
                              Match Score: {match.score}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Current: <strong>{match.currentLocation}</strong> • Deadhead: <strong>{match.deadheadMiles} mi</strong> • Total Trip: {match.totalMiles} mi
                          </p>
                        </div>

                        {/* Financial Spread Breakdown */}
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Carrier Net Payout</span>
                            <span className="font-bold text-slate-900 font-mono text-sm block">
                              ${match.carrierNetPayout.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              ${(match.carrierNetPayout / match.totalMiles).toFixed(2)}/mi net
                            </span>
                          </div>

                          <div className="pl-3 border-l border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ace Dispatch Fee</span>
                            <span className="font-black text-emerald-700 font-mono text-sm block">
                              +${match.aceDispatchFee.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">8.0% contracted</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100/80 text-[11px] text-slate-600 flex items-center justify-between">
                        <span>{match.matchReason}</span>
                        {match.isRateAcceptable ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Meets Min RPM (${match.minRatePerMile.toFixed(2)})
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Below Min RPM (${match.minRatePerMile.toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
