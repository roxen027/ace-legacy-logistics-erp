"use client";

import { useState } from "react";
import { parseRateConTextAction, createLoadFromAiRateConAction } from "@/app/actions/ai";
import { RateConParsedData } from "@/lib/ai/types";
import {
  Sparkles,
  FileText,
  Upload,
  Layers,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  MapPin,
  DollarSign,
  ShieldCheck,
} from "lucide-react";

const SAMPLE_RATE_CON = `CARRIER RATE CONFIRMATION & FREIGHT TENDER
Broker: C.H. Robinson Worldwide, Inc.
Contact: Sarah Jenkins | Direct: +1 (800) 555-0199
Load Ref: CHR-992182
Commodity: Packaged Organic Juice & Beverages
Equipment: 53' Reefer (Refrigerated) | Temp: Continuous 34 F
Weight: 42,000 lbs | Pallets: 26
Contracted Agreed Rate: $3,450.00 USD (All-In Fuel Included)

STOP 1: PICKUP (Shipper Dock)
Facility: Apex Food Distribution Center
Address: 3200 Mountain Creek Pkwy, Dallas, TX 75236
Appt: 2026-11-06 08:00 AM - 12:00 PM (US Central Time)
Special Instructions: Clean reefer trailer required. Pre-cool to 34F before arrival.

STOP 2: DELIVERY (Consignee)
Facility: Southeast Regional Distribution Hub
Address: 1850 Logistics Way, Forest Park, GA 30297
Appt: 2026-11-07 09:00 AM - 01:00 PM (US Eastern Time)
Contact: Receiving Office Dock 12`;

export function AiDocumentParserModal({
  defaultDivision = "BROKERAGE",
  onSuccess,
}: {
  defaultDivision?: "BROKERAGE" | "DISPATCH";
  onSuccess?: (loadNumber: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [division, setDivision] = useState<"BROKERAGE" | "DISPATCH">(defaultDivision);
  const [isParsing, setIsParsing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [parsedData, setParsedData] = useState<RateConParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleParse = async () => {
    if (!rawText.trim()) {
      setError("Please paste Rate Confirmation or order text to parse.");
      return;
    }
    setError(null);
    setIsParsing(true);
    try {
      const res = await parseRateConTextAction(rawText, division);
      if (res.success && res.data) {
        setParsedData(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse document text.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreateLoad = async () => {
    if (!parsedData) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await createLoadFromAiRateConAction(parsedData);
      if (res.success) {
        setSuccessMessage(`Successfully created load ${res.loadNumber} in ${res.division} ledger!`);
        if (onSuccess) onSuccess(res.loadNumber);
        setTimeout(() => {
          setIsOpen(false);
          setParsedData(null);
          setRawText("");
          setSuccessMessage(null);
        }, 1800);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create load from parsed data.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
      >
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> AI Rate Con Parser
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    AI Rate Confirmation & Document Intelligence
                  </h3>
                  <p className="text-xs text-slate-500">
                    Extract structured freight orders, verify rates, and auto-generate live ERP loads
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 flex-1">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Division Selector & Quick Paste */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Target Division:</span>
                  <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setDivision("BROKERAGE")}
                      className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                        division === "BROKERAGE"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-blue-700"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" /> Freight Brokerage (TMS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDivision("DISPATCH")}
                      className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                        division === "DISPATCH"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-emerald-700"
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" /> Truck Dispatching
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_RATE_CON)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                >
                  Load Sample Rate Con Text
                </button>
              </div>

              {/* Text Input Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Paste Document Text / OCR Extraction / Tender Email:
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                  placeholder="Paste raw tender agreement, Rate Confirmation, or BOL text here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={isParsing || !rawText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> AI Analyzing & Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" /> Run AI Document Parser
                    </>
                  )}
                </button>
              </div>

              {/* Parsed Results Card */}
              {parsedData && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        AI Extracted Load Data ({parsedData.confidenceScore}% Confidence)
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {parsedData.division} Load
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">External Broker</span>
                      <span className="font-bold text-slate-900 truncate block">{parsedData.brokerName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{parsedData.brokerRefNumber}</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rate / Pay</span>
                      <span className="font-bold text-emerald-700 text-sm font-mono block">
                        ${(parsedData.customerRate || parsedData.grossFreightRate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {parsedData.division === "BROKERAGE" ? `Carrier Pay: $${parsedData.carrierRate}` : "Carrier Gross Pay"}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Equipment</span>
                      <span className="font-bold text-slate-900 block">{parsedData.equipment.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-slate-500">{parsedData.weightLbs.toLocaleString()} lbs</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Mileage</span>
                      <span className="font-bold text-slate-900 text-sm block">{parsedData.totalMiles} mi</span>
                      <span className="text-[10px] text-slate-500">
                        ~${((parsedData.customerRate || parsedData.grossFreightRate) / parsedData.totalMiles).toFixed(2)}/mi
                      </span>
                    </div>
                  </div>

                  {/* Stops Preview */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-2 text-xs">
                    <div className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                      Multi-Stop Execution Schedule
                    </div>
                    {parsedData.stops.map((stop) => (
                      <div key={stop.stopSequence} className="flex items-start gap-2 pt-1 border-t border-slate-100 first:border-0 first:pt-0">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          stop.stopType === "PICKUP" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {stop.stopType}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-900">{stop.facilityName}</span> ({stop.city}, {stop.state})
                          <div className="text-[10px] text-slate-400">
                            Appt Window: {new Date(stop.apptWindowStart).toLocaleString()} ({stop.timezone})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleCreateLoad}
                      disabled={isCreating}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Auto-Creating Load...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Ingest & Create {parsedData.division} Load
                        </>
                      )}
                    </button>
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
