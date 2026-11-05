"use client";

import { useState } from "react";
import { aiVerifyPodAnd3WayMatchAction } from "@/app/actions/ai";
import { PodVerificationData } from "@/lib/ai/types";
import {
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  DollarSign,
  Sparkles,
  Receipt,
} from "lucide-react";

export function AiPodAuditModal({
  loadId,
  loadNumber,
  customerName,
  carrierName,
  agreedRate,
  onVerified,
}: {
  loadId: string;
  loadNumber: string;
  customerName: string;
  carrierName: string;
  agreedRate: number;
  onVerified?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [podText, setPodText] = useState(
    `DELIVERY RECEIPT & PROOF OF DELIVERY
Load: ${loadNumber}
Consignee: Receiving Hub Dock 12
Status: Freight received in full and satisfactory condition.
Total Pallets: 26 | Weight: 42,000 lbs
Receiver Signature: Johnathan Davis (Receiving Supervisor)
Date/Time: 2026-11-06 14:15 EST
No exceptions, overages, shortages, or damages noted.
Billed Amount: $${agreedRate.toFixed(2)} USD`
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [result, setResult] = useState<PodVerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setError(null);
    try {
      const res = await aiVerifyPodAnd3WayMatchAction(loadId, podText);
      setResult(res.verification);
      if (res.success) {
        setSuccess("3-Way Match Verified! Load transitioned to POD_VERIFIED and Shipper AR Invoice generated.");
        if (onVerified) onVerified();
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(null);
        }, 2000);
      } else {
        setError("Audit Exception detected on document. Load held for manual investigation.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to audit Proof of Delivery.");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-[11px] rounded shadow-xs flex items-center justify-center gap-1.5 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> AI POD 3-Way Match & Verify
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    AI Proof of Delivery & AP 3-Way Audit
                  </h3>
                  <p className="text-xs text-slate-500">
                    Load {loadNumber} • {customerName} / {carrierName}
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

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-purple-700 font-semibold uppercase block">Rate Confirmation Contract</span>
                  <span className="font-bold text-purple-950 font-mono text-sm">${agreedRate.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-purple-700 font-semibold uppercase block">Target Audit Step</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Clean Signature & Rate Match
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scanned POD / Delivery Receipt Text:
                </label>
                <textarea
                  value={podText}
                  onChange={(e) => setPodText(e.target.value)}
                  rows={6}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPodText((prev) => prev.replace("satisfactory condition", "2 pallets crushed and leaking water"))}
                  className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 hover:bg-amber-100"
                >
                  Test Damage / OS&D Flag
                </button>
                <button
                  type="button"
                  onClick={() => setPodText((prev) => prev.replace(`$${agreedRate.toFixed(2)}`, `$${(agreedRate + 300).toFixed(2)}`))}
                  className="text-[11px] text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200 hover:bg-red-100"
                >
                  Test Rate Discrepancy (+$300)
                </button>
              </div>

              {result && (
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Audit Result:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      result.verificationPassed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {result.recommendedAction.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{result.auditSummary}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying 3-Way Match...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" /> Run AI Audit & Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
