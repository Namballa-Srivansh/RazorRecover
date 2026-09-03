"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { 
  ShieldAlert, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  MessageSquare,
  Clock,
  TrendingUp,
  FileCheck,
  Pause,
  AlertTriangle,
  Play,
  RotateCcw
} from "lucide-react";

export default function Cases() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [customReply, setCustomReply] = useState("");

  async function loadCases() {
    try {
      setLoading(true);
      const filter = statusFilter === "all" ? undefined : statusFilter;
      const res = await api.getCases(filter);
      setCases(res.data);
      if (res.data.length > 0 && !selectedCase) {
        handleSelectCase(res.data[0]);
      } else if (selectedCase) {
        const updatedSelected = res.data.find((c: any) => c._id === selectedCase._id);
        if (updatedSelected) {
          handleSelectCase(updatedSelected);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, [statusFilter]);

  const handleSelectCase = async (kase: any) => {
    setSelectedCase(kase);
    try {
      const logsRes = await api.getAuditLogs(kase._id);
      setAuditLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerOutreach = async () => {
    if (!selectedCase) return;
    try {
      setActionLoading(true);
      await api.generateOutreach(selectedCase._id);
      // Reload cases
      const res = await api.getCaseById(selectedCase._id);
      handleSelectCase(res.data);
      loadCases();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const simulateCustomerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !customReply.trim()) return;
    try {
      setActionLoading(true);
      await api.customerReply(selectedCase._id, customReply);
      setCustomReply("");
      // Reload
      const res = await api.getCaseById(selectedCase._id);
      handleSelectCase(res.data);
      loadCases();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const triggerConfirmPayment = async () => {
    if (!selectedCase) return;
    try {
      setActionLoading(true);
      await api.confirmPayment(selectedCase._id);
      // Reload
      const res = await api.getCaseById(selectedCase._id);
      handleSelectCase(res.data);
      loadCases();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const togglePauseResume = async () => {
    if (!selectedCase) return;
    const targetStatus = selectedCase.status === 'paused' ? 'in_recovery' : 'paused';
    try {
      setActionLoading(true);
      await api.updateCase(selectedCase._id, { status: targetStatus });
      const res = await api.getCaseById(selectedCase._id);
      handleSelectCase(res.data);
      loadCases();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950 flex-1 flex flex-col h-full overflow-hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Recovery Queue</h1>
        <p className="text-slate-400 mt-1">Diagnose transaction root causes, review chat timelines, and execute actions.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 pb-px shrink-0">
        {["all", "pending", "in_recovery", "recovered", "paused", "failed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              statusFilter === tab
                ? "border-amber-500 text-amber-500 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Split Pane View */}
      <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
        {/* Left Side: Cases List */}
        <div className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto flex flex-col">
          {loading && cases.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20 text-xs">
              <div className="h-8 w-8 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin mb-4"></div>
              Loading cases...
            </div>
          ) : cases.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20 text-xs">
              <ShieldAlert className="h-8 w-8 text-slate-600 mb-2" />
              No cases matching filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 flex-1">
              {cases.map((c) => (
                <div
                  key={c._id}
                  onClick={() => handleSelectCase(c)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedCase?._id === c._id
                      ? "bg-amber-500/5 border-l-4 border-l-amber-500 bg-slate-800/40"
                      : "hover:bg-slate-800/30 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                      {c.case_type.replace("_", " ")}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      c.status === "recovered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      c.status === "paused" ? "bg-slate-800 text-slate-400 border border-slate-700" :
                      c.status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-bold text-slate-100 mt-2 text-xs">{c.customer.name}</div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs font-bold text-slate-300">
                      ₹{c.amount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Case Detail View */}
        <div className="w-2/3 flex flex-col overflow-hidden">
          {selectedCase ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-900 border border-slate-800 rounded-xl">
              {/* Detail Header */}
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">{selectedCase.customer.name}</h2>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      selectedCase.status === "recovered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      selectedCase.status === "paused" ? "bg-slate-800 text-slate-400 border border-slate-700" :
                      selectedCase.status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {selectedCase.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 text-[11px] mt-2">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {selectedCase.customer.email}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {selectedCase.customer.phone}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Action 1: Confirm Payment */}
                  {selectedCase.status !== "recovered" && (
                    <button
                      onClick={triggerConfirmPayment}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg shadow-emerald-500/10"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      Mock Settle Payment
                    </button>
                  )}

                  {/* Action 2: Pause/Resume Outreach */}
                  {selectedCase.status !== "recovered" && selectedCase.status !== "failed" && (
                    <button
                      onClick={togglePauseResume}
                      disabled={actionLoading}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded-lg transition-colors border ${
                        selectedCase.status === "paused"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {selectedCase.status === "paused" ? (
                        <>
                          <Play className="h-3.5 w-3.5" /> Resume Agent
                        </>
                      ) : (
                        <>
                          <Pause className="h-3.5 w-3.5" /> Pause Agent
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Split Pane: Diagnosis & Audits (Left), Chat (Right) */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Scrollable details & audit */}
                <div className="w-1/2 p-6 border-r border-slate-800 overflow-y-auto space-y-6">
                  {/* AI Diagnosis block */}
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" /> AI Diagnostic Report
                    </div>
                    <div className="text-xs font-semibold text-slate-300">Root Cause:</div>
                    <p className="text-slate-400 text-xs mt-0.5 font-medium leading-relaxed">{selectedCase.root_cause}</p>
                    
                    {selectedCase.promise_to_pay_date && (
                      <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-purple-400" />
                        <div className="text-[10px] text-slate-300 font-semibold">
                          Promise to Pay: {new Date(selectedCase.promise_to_pay_date).toDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audit Timeline */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Recovery Logs & Audit Trail
                    </h3>
                    <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-5">
                      {auditLogs.map((log) => (
                        <div key={log._id} className="relative">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border ${
                            log.compliance_check
                              ? "bg-purple-500 border-purple-400 animate-ping"
                              : log.action.includes("Success")
                              ? "bg-emerald-500 border-emerald-400"
                              : "bg-slate-700 border-slate-600"
                          }`}></div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span className="font-bold uppercase text-[9px] text-slate-400 bg-slate-800 px-1 py-0.2 rounded">
                              {log.action}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs mt-1 leading-relaxed">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulation Chat Box */}
                <div className="w-1/2 flex flex-col overflow-hidden bg-slate-950/20">
                  {/* Messages list */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {selectedCase.conversations.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
                        <MessageSquare className="h-8 w-8 text-slate-700 mb-2" />
                        No communication drafts sent yet.
                        <button
                          onClick={triggerOutreach}
                          disabled={actionLoading}
                          className="mt-4 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-lg border border-amber-500/20"
                        >
                          Trigger Stage 0 Outreach
                        </button>
                      </div>
                    ) : (
                      selectedCase.conversations.map((msg: any, idx: number) => {
                        const isAgent = msg.sender === "agent";
                        return (
                          <div 
                            key={idx} 
                            className={`flex flex-col max-w-[85%] ${
                              isAgent ? "mr-auto" : "ml-auto items-end"
                            }`}
                          >
                            <div className="text-[9px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                              {isAgent ? "AI agent" : "customer reply"}
                            </div>
                            <div 
                              className={`p-3 rounded-xl text-xs leading-relaxed ${
                                isAgent 
                                  ? "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none" 
                                  : "bg-amber-500 text-slate-950 font-medium rounded-tr-none"
                              }`}
                            >
                              {msg.message}
                            </div>
                            <span className="text-[8px] text-slate-600 font-mono mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input form */}
                  {selectedCase.status !== "recovered" && selectedCase.status !== "paused" && (
                    <div className="p-4 border-t border-slate-800 bg-slate-900/40 shrink-0">
                      <form onSubmit={simulateCustomerMessage} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Simulate customer message reply..."
                          value={customReply}
                          onChange={(e) => setCustomReply(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                        />
                        <button
                          type="submit"
                          disabled={actionLoading || !customReply.trim()}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/30 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                        >
                          Simulate Reply
                        </button>
                      </form>
                      
                      <div className="flex justify-between items-center mt-2.5 px-1">
                        <span className="text-[9px] text-slate-500">Escalation Stage: {selectedCase.escalation_stage} / 3</span>
                        <button
                          type="button"
                          onClick={triggerOutreach}
                          disabled={actionLoading}
                          className="text-[9px] text-amber-500 hover:underline font-semibold"
                        >
                          Trigger Next AI Outreach &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-slate-800 rounded-xl text-slate-500">
              <ShieldAlert className="h-10 w-10 text-slate-600 mb-2" />
              Select a failure case on the left to see audit details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
