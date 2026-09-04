"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import Link from "next/link";
import { 
  Plus, 
  Layers, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  Zap,
  Code2,
  Trash2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CreditCard
} from "lucide-react";

export default function Batches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detectedCasesCount, setDetectedCasesCount] = useState<number | null>(null);

  async function loadBatches() {
    try {
      setLoading(true);
      const res = await api.getBatches();
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  // Track valid case counts dynamically from json input
  useEffect(() => {
    if (!jsonInput.trim()) {
      setDetectedCasesCount(null);
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        setDetectedCasesCount(parsed.length);
      } else {
        setDetectedCasesCount(null);
      }
    } catch {
      setDetectedCasesCount(null);
    }
  }, [jsonInput]);

  const sampleBatches = {
    checkout: [
      {
        case_type: "checkout_abandonment",
        amount: 3200,
        customer: { name: "Vikram Malhotra", email: "vikram.m@example.com", phone: "+919100100200" },
        gateway_log: "Transaction aborted on checkout screen. Payment page closed by user. Cause: Netbanking bank list load timeout.",
        error_code: "504",
        error_description: "Gateway Timeout"
      },
      {
        case_type: "payment_failure",
        amount: 8500,
        customer: { name: "Shalini Gupta", email: "shalini.g@example.com", phone: "+919200200300" },
        gateway_log: "3D Secure auth failed. OTP validation timed out on customer banking portal. code 400 - OTP expired.",
        error_code: "auth_failed",
        error_description: "OTP Verification Timeout"
      },
      {
        case_type: "payment_failure",
        amount: 4750,
        customer: { name: "Aakash Roy", email: "aakash.roy@example.com", phone: "+919311223344" },
        gateway_log: "UPI collect request timed out after 5 minutes without approval from PSP app.",
        error_code: "upi_timeout",
        error_description: "UPI Authorization Timed Out"
      }
    ],
    subscriptions: [
      {
        case_type: "subscription_failed",
        amount: 1499,
        customer: { name: "Rohit Deshmukh", email: "rohit.desh@example.com", phone: "+919300300400" },
        gateway_log: "Card pre-auth recurring debit failed. Message: Insufficient funds in debit account. error_code: LIMIT_EXCEEDED",
        error_code: "insufficient_funds",
        error_description: "Card Limit Exceeded / Insufficient Funds"
      },
      {
        case_type: "subscription_failed",
        amount: 2999,
        customer: { name: "Ananya Iyer", email: "ananya.iyer@example.com", phone: "+919400400500" },
        gateway_log: "Mandate recurring charge failed. Error message: Tokenized card expired. Date: 08-2026. code: CARD_EXPIRED",
        error_code: "expired_instrument",
        error_description: "Card Expired"
      },
      {
        case_type: "subscription_failed",
        amount: 5999,
        customer: { name: "Sameer Joshi", email: "sameer.j@example.com", phone: "+919877001122" },
        gateway_log: "E-mandate debit rejected by issuer bank: Customer revoked standing instructions.",
        error_code: "mandate_revoked",
        error_description: "Customer Revoked Mandate"
      }
    ]
  };

  const loadSample = (type: "checkout" | "subscriptions") => {
    setName(type === "checkout" ? "Interactive checkout drop-offs" : "Recurring subscription fails");
    setJsonInput(JSON.stringify(sampleBatches[type], null, 2));
    setErrorMsg("");
  };

  const handleClear = () => {
    setName("");
    setJsonInput("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      if (!name.trim()) throw new Error("Please provide a name for this recovery batch.");
      if (!jsonInput.trim()) throw new Error("JSON payload cannot be empty.");
      
      let parsedCases;
      try {
        parsedCases = JSON.parse(jsonInput);
      } catch (err) {
        throw new Error("Invalid JSON formatting. Please check syntax for missing commas or quotes.");
      }

      if (!Array.isArray(parsedCases) || parsedCases.length === 0) {
        throw new Error("JSON must be a non-empty array of transaction cases.");
      }

      await api.createBatch(name, parsedCases);
      setSuccessMsg(`Successfully ingested batch "${name}" with ${parsedCases.length} case(s)! AI Agent reasoning triggered.`);
      setName("");
      setJsonInput("");
      await loadBatches();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit batch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-8 bg-slate-50 min-h-screen w-full max-w-[1700px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">Recovery Batches</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              <Zap className="h-3.5 w-3.5 mr-1 text-blue-600" />
              AI Agent Ingestion Engine
            </span>
          </div>
          <p className="text-slate-600 mt-2 text-base max-w-3xl">
            Upload transaction cohorts, payment drop-offs, or webhook logs to trigger autonomous diagnosis and agentic outreach sequences.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button 
            onClick={loadBatches}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-xs hover:border-slate-400 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left column: Ingest New Cohort Form */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900">Ingest New Cohort</h2>
                <p className="text-xs text-slate-500">Provide cohort identifier and raw transaction logs</p>
              </div>
            </div>

            {jsonInput && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors"
                title="Clear inputs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Batch Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Batch Name / Campaign Label
              </label>
              <input 
                type="text" 
                placeholder="e.g. Sept Checkout Drop-offs Batch A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>

            {/* JSON Input Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Failed Cases JSON Payload
                  </label>
                  {detectedCasesCount !== null && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {detectedCasesCount} {detectedCasesCount === 1 ? "case" : "cases"} ready
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">Load preset:</span>
                  <button 
                    type="button" 
                    onClick={() => loadSample("checkout")}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition-all"
                  >
                    <CreditCard className="h-3 w-3" />
                    + Checkout Sample
                  </button>
                  <button 
                    type="button" 
                    onClick={() => loadSample("subscriptions")}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition-all"
                  >
                    <RefreshCw className="h-3 w-3" />
                    + Sub Sample
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl border border-slate-300 bg-slate-900 text-slate-100 overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>JSON Schema [Array of Cases]</span>
                  </div>
                  <span>UTF-8</span>
                </div>
                <textarea 
                  rows={14}
                  placeholder={`[\n  {\n    "case_type": "checkout_abandonment",\n    "amount": 3200,\n    "customer": { "name": "Vikram Malhotra", "email": "vikram@example.com" },\n    "gateway_log": "Netbanking session timeout at OTP stage"\n  }\n]`}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full bg-slate-900 px-4 py-3.5 text-xs md:text-sm font-mono text-slate-100 focus:outline-none transition-colors placeholder:text-slate-600 leading-relaxed resize-y min-h-[320px]"
                  spellCheck={false}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Supports Razorpay webhook logs, failed charge payloads, and custom cohort arrays.
              </p>
            </div>

            {/* Error Feedback */}
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs md:text-sm rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="font-medium">{errorMsg}</div>
              </div>
            )}

            {/* Success Feedback */}
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                <div className="font-medium">{successMsg}</div>
              </div>
            )}

            {/* Action Button */}
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-base rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Agentic Diagnosis In Progress...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-blue-200" />
                  <span>Run AI Recovery Loop</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right column: Ingestion History List */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900">Ingestion History & Cohorts</h2>
                <p className="text-xs text-slate-500">Live recovery performance per ingested batch</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                {batches.length} {batches.length === 1 ? "Batch" : "Batches"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-500 text-sm space-y-3">
              <div className="h-10 w-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="font-semibold text-slate-700">Loading recovery cohort history...</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="py-20 px-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 bg-slate-50/50">
              <FileSpreadsheet className="h-12 w-12 text-slate-400 mb-3" />
              <span className="text-base font-bold text-slate-800">No recovery cohorts found</span>
              <span className="text-sm text-slate-500 mt-1 text-center max-w-sm">
                Use the ingestion form on the left or click "Checkout Sample" to ingest your first recovery batch.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => {
                const recoveryRate = batch.total_cases > 0 
                  ? Math.round((batch.recovered_cases / batch.total_cases) * 100) 
                  : 0;

                const amountRate = batch.total_amount > 0 
                  ? Math.round((batch.recovered_amount / batch.total_amount) * 100) 
                  : 0;

                return (
                  <div 
                    key={batch._id} 
                    className="p-5 md:p-6 bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col space-y-4"
                  >
                    {/* Top Row: Batch Title & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-base md:text-lg text-slate-900">{batch.name}</h3>
                          <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                            batch.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            {batch.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-xs mt-1 font-medium">
                          <span>Ingested: {new Date(batch.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                          <span>•</span>
                          <span className="text-slate-700 font-semibold">Total Cases: {batch.total_cases}</span>
                        </div>
                      </div>

                      <Link 
                        href={`/cases`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 self-start sm:self-auto group"
                      >
                        <span>View Cases</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>

                    {/* Middle: Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">Recovery Progress</span>
                        <span className="text-blue-600 font-bold">{recoveryRate}% cases resolved</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            recoveryRate === 100 
                              ? "bg-emerald-500" 
                              : recoveryRate > 0 
                              ? "bg-blue-600" 
                              : "bg-slate-300"
                          }`}
                          style={{ width: `${Math.max(recoveryRate, 4)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom: Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Recovered Cases
                        </div>
                        <div className="text-base font-extrabold text-emerald-600 mt-1">
                          {batch.recovered_cases} <span className="text-xs font-normal text-slate-500">/ {batch.total_cases}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                          Value Saved
                        </div>
                        <div className="text-base font-extrabold text-slate-900 mt-1">
                          ₹{batch.recovered_amount.toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div className="col-span-2 sm:col-span-1 p-3 bg-white rounded-xl border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
                          Total Cohort Value
                        </div>
                        <div className="text-base font-extrabold text-slate-700 mt-1">
                          ₹{batch.total_amount.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


