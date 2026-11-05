"use client";

import { useState } from "react";
import { aiEmailToQuoteAction } from "@/app/actions/ai";
import { EmailQuoteParsedData } from "@/lib/ai/types";
import {
  Sparkles,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  ArrowRight,
  TrendingUp,
  DollarSign,
  ShieldAlert,
} from "lucide-react";

const SAMPLE_COMPLIANT_EMAIL = `Subject: RFQ: 3 Loads Weekly - Dallas, TX to Atlanta, GA (Reefer)
From: Richard Gomez <rgomez@apexfoods.com>
To: sales@acelegacyservices.com

Hi Jordan,
We have a steady weekly corridor starting next Tuesday. 
Need 53' Reefer trailers holding 34F continuous, hauling fresh packaged salad greens.
Dallas, TX (Zip 75236) to Forest Park, GA (Zip 30297).
Distance is roughly 780 miles. Weight is approx 42,000 lbs.
Can you provide your best all-in rate including fuel?
Looking forward to booking with Ace Legacy.

Thanks,
Richard Gomez
Director of Transportation, Apex Food Distributors`;

const SAMPLE_LOW_MARGIN_EMAIL = `Subject: Spot Quote Request - Steel Tubing Gary IN to Houston TX
From: Mark Kovacs <mkovacs@summitsteel.com>

Need a Flatbed picking up tomorrow in Gary, IN going to Houston, TX (approx 1,020 miles).
46,000 lbs structural pipe.
Our customer target budget is capped at $2,600.00 all-in.
Let me know if you can cover this immediately.

Best,
Mark Kovacs`;

export function AiQuoteIntakeDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [emailText, setEmailText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ quoteNumber: string; parsed: EmailQuoteParsedData } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessEmail = async () => {
    if (!emailText.trim()) {
      setError("Please paste a shipper RFQ email to analyze.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      const res = await aiEmailToQuoteAction(emailText);
      if (res.success && res.parsed) {
        setResult({ quoteNumber: res.quoteNumber, parsed: res.parsed });
      }
    } catch (err: any) {
      setError(err.message || "Failed to process email inquiry.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> AI Email-to-Quote Intake
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Mail className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    AI Email RFQ & Pricing Governance Engine
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paste raw customer rate inquiry $\rightarrow$ instant lane extraction, market pricing & margin check
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

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Sample Pastes */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-500 text-[11px]">Quick Samples:</span>
                <button
                  type="button"
                  onClick={() => setEmailText(SAMPLE_COMPLIANT_EMAIL)}
                  className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-[11px] font-bold"
                >
                  Load Compliant RFQ (&gt;15% Margin)
                </button>
                <button
                  type="button"
                  onClick={() => setEmailText(SAMPLE_LOW_MARGIN_EMAIL)}
                  className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-bold"
                >
                  Load Low-Margin RFQ (&lt;12% Review)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer RFQ Email Body:
                </label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  rows={6}
                  placeholder="Paste raw email text from shipper..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProcessEmail}
                  disabled={isProcessing || !emailText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Lane & Margin...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" /> Parse & Generate Quote
                    </>
                  )}
                </button>
              </div>

              {/* Result Preview */}
              {result && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      Quote Created: {result.quoteNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      result.parsed.requiresManagerApproval
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}>
                      {result.parsed.requiresManagerApproval ? "PENDING MANAGER APPROVAL" : "AUTO-APPROVED"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 bg-white rounded border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Shipper</span>
                      <span className="font-bold text-slate-900 truncate block">{result.parsed.shipperCompanyName}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Lane</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {result.parsed.originCity}, {result.parsed.originState} $\rightarrow$ {result.parsed.destCity}, {result.parsed.destState}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Quoted Rate</span>
                      <span className="font-bold font-mono text-slate-900 block">${result.parsed.suggestedCustomerRate.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Gross Margin</span>
                      <span className={`font-bold font-mono block ${
                        result.parsed.projectedMarginPercent < 12 ? "text-amber-700" : "text-emerald-700"
                      }`}>
                        +${result.parsed.projectedMargin.toFixed(2)} ({result.parsed.projectedMarginPercent}%)
                      </span>
                    </div>
                  </div>

                  {result.parsed.requiresManagerApproval && (
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{result.parsed.approvalReason}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 pt-1">
                    {result.parsed.reasoning}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
