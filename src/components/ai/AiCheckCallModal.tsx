"use client";

import { useState } from "react";
import { triggerAiCheckCallAction } from "@/app/actions/ai";
import { CheckCallProcessingResult } from "@/lib/ai/types";
import {
  PhoneCall,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  Loader2,
  Radio,
  ShieldAlert,
} from "lucide-react";

const SAMPLES = [
  {
    label: "On Schedule / Rolling",
    text: "Hey dispatch, Darius here. Rolling smooth on I-20 East near Meridian, MS. Traffic is clear, ETA to Forest Park GA is right on schedule for 4:30 PM.",
  },
  {
    label: "Heavy Detention (2.5 hrs)",
    text: "Still sitting at the shipper distribution dock in Dallas. Been backed into dock door 14 for 2.5 hours now with no loader. Please log detention rate with the broker.",
  },
  {
    label: "Mechanical Breakdown (Urgent)",
    text: "Got a major breakdown on the highway right outside Texarkana. Blown right trailer tire and possible axle seal leak. Waiting for emergency roadside assistance service.",
  },
  {
    label: "Delivery Complete",
    text: "Freight is completely offloaded at the consignee dock. BOL signed clean with zero damages or shortages. Pulling out empty now.",
  },
];

export function AiCheckCallModal({
  loadId,
  loadNumber,
  driverName,
  division = "BROKERAGE",
  onUpdated,
}: {
  loadId: string;
  loadNumber: string;
  driverName?: string;
  division?: "BROKERAGE" | "DISPATCH";
  onUpdated?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState(SAMPLES[0].text);
  const [isCalling, setIsCalling] = useState(false);
  const [result, setResult] = useState<CheckCallProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulateCall = async () => {
    if (!transcript.trim()) return;
    setIsCalling(true);
    setError(null);
    try {
      const res = await triggerAiCheckCallAction(loadId, division, transcript);
      if (res.success && res.analysis) {
        setResult(res.analysis);
        if (onUpdated) onUpdated();
      }
    } catch (err: any) {
      setError(err.message || "Failed to process check call.");
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[11px] rounded shadow-xs flex items-center gap-1.5 transition-all"
      >
        <Radio className="w-3 h-3 text-red-300 animate-pulse" /> AI Voice Check-Call
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                  <PhoneCall className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    AI Voice Check-Call Assistant (Telephony Agent)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Load {loadNumber} • Driver: {driverName || "Assigned Driver"}
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

              {/* Sample Scenarios */}
              <div>
                <span className="font-semibold text-slate-600 block mb-1.5 text-[11px]">
                  Simulate Inbound/Outbound Call Scenarios:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SAMPLES.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTranscript(s.text)}
                      className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-blue-900 transition-all"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Driver Audio Transcript / Telephony Payload:
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSimulateCall}
                  disabled={isCalling}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isCalling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Calling Driver & Analyzing Audio...
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4" /> Dispatch AI Check-Call
                    </>
                  )}
                </button>
              </div>

              {result && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold border-b border-slate-200 pb-2">
                    <span className="flex items-center gap-1.5 text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" /> Location: {result.location}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      result.isIssueDetected
                        ? "bg-red-100 text-red-800 border border-red-300 font-bold"
                        : "bg-emerald-100 text-emerald-800 font-bold"
                    }`}>
                      {result.isIssueDetected ? `EXCEPTION: ${result.issueSeverity}` : "TRANSIT NORMAL"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 font-medium">
                    {result.statusUpdate}
                  </p>

                  {result.isIssueDetected && (
                    <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 text-red-800 text-[11px] flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block">{result.issueTitle}</strong>
                        <span>{result.issueDescription}</span>
                        <div className="mt-1 text-[10px] font-bold text-red-900">
                          ⚡ Automated Task created and dispatched to Operations Manager!
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono">
                    {result.summaryNote}
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
