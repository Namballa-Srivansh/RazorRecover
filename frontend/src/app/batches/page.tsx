"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { 
  Plus, 
  Layers, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react";

export default function Batches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      }
    ]
  };

  const loadSample = (type: "checkout" | "subscriptions") => {
    setName(type === "checkout" ? "Interactive checkout drop-offs" : "Recurring subscription fails");
    setJsonInput(JSON.stringify(sampleBatches[type], null, 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      if (!name) throw new Error("Batch name is required");
      if (!jsonInput) throw new Error("JSON payload is required");
      
      let parsedCases;
      try {
        parsedCases = JSON.parse(jsonInput);
      } catch (err) {
        throw new Error("Invalid JSON formatting. Please check syntax.");
      }

      if (!Array.isArray(parsedCases)) {
        throw new Error("JSON must be an array of transaction cases.");
      }

      await api.createBatch(name, parsedCases);
      setSuccessMsg("Batch uploaded and AI agentic diagnosis initialized!");
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
    <div className="p-8 space-y-8 bg-slate-950">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Recovery Batches</h1>
        <p className="text-slate-400 mt-1">Upload cohorts of failed payments to trigger automatic recovery campaigns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side: Upload form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-amber-500" />
            <h3 className="text-md font-bold text-white">Ingest New Cohort</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Batch Name</label>
              <input 
                type="text" 
                placeholder="e.g. Aug Checkout Failures Batch B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Failed Cases JSON</label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => loadSample("checkout")}
                    className="text-[9px] bg-slate-800 text-amber-400 font-semibold px-2 py-0.5 rounded border border-slate-700 hover:border-amber-500/30"
                  >
                    + Checkout Sample
                  </button>
                  <button 
                    type="button" 
                    onClick={() => loadSample("subscriptions")}
                    className="text-[9px] bg-slate-800 text-amber-400 font-semibold px-2 py-0.5 rounded border border-slate-700 hover:border-amber-500/30"
                  >
                    + Sub Sample
                  </button>
                </div>
              </div>
              <textarea 
                rows={10}
                placeholder="Paste transaction failure logs JSON array..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold text-sm rounded-lg transition-colors shadow-lg shadow-amber-500/10"
            >
              {submitting ? "Analyzing and Ingesting..." : "Run AI Recovery Loop"}
            </button>
          </form>
        </div>

        {/* Right side: Batches list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-500" />
              <h3 className="text-md font-bold text-white">Ingestion History</h3>
            </div>
            <button 
              onClick={loadBatches}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm">
              <div className="h-8 w-8 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin mb-4"></div>
              Refreshing history...
            </div>
          ) : batches.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500">
              <FileSpreadsheet className="h-10 w-10 text-slate-600 mb-2" />
              <span className="text-sm font-semibold">No recovery batches found</span>
              <span className="text-xs text-slate-600 mt-1">Use the ingestion form to load sample transaction data.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                <div key={batch._id} className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700/60 transition-colors">
                  <div>
                    <h4 className="font-bold text-sm text-white">{batch.name}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-xs mt-1.5">
                      <span>Ingested: {new Date(batch.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-400">Total Cases: {batch.total_cases}</span>
                    </div>
                  </div>
                  
                  {/* Stats segment */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Recovered</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {batch.recovered_cases} / {batch.total_cases} cases
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Value Saved</div>
                      <div className="text-sm font-bold text-white">
                        ₹{batch.recovered_amount.toLocaleString("en-IN")} / ₹{batch.total_amount.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        batch.recovered_cases === batch.total_cases && batch.total_cases > 0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {batch.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
