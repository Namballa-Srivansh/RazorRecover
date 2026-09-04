"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { 
  ShieldAlert, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Clock, 
  FileCheck, 
  Pause, 
  Play 
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
    <div className="p-8 space-y-8 bg-slate-50 flex-1 flex flex-col h-full overflow-hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recovery Queue</h1>
        <p className="text-slate-500 mt-1 text-sm">Diagnose transaction root causes, review chat timelines, and execute actions.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 pb-px shrink-0 gap-2">
        {["all", "pending", "in_recovery", "recovered", "paused", "failed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              statusFilter === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Split Pane View */}
      <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
        {/* Left Side: Cases List */}
        <div className="w-1/3 bg-white border border-slate-200 rounded-xl overflow-y-auto flex flex-col shadow-xs">
          {loading && cases.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20 text-xs">
              <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              Loading cases...
            </div>
          ) : cases.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20 text-xs">
              <ShieldAlert className="h-8 w-8 text-slate-300 mb-2" />
              No cases matching filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {cases.map((c) => (
                <div
                  key={c._id}
                  onClick={() => handleSelectCase(c)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedCase?._id === c._id
                      ? "bg-blue-50/70 border-l-4 border-l-blue-600"
                      : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                      {c.case_type.replace("_", " ")}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      c.status === "recovered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      c.status === "paused" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                      c.status === "failed" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                      "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 mt-2 text-xs">{c.customer.name}</div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs font-bold text-slate-900">
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
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xs">
              {/* Detail Header */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/60 shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-extrabold text-slate-900">{selectedCase.customer.name}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedCase.status === "recovered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      selectedCase.status === "paused" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                      selectedCase.status === "failed" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                      "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {selectedCase.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 text-[11px] mt-2 font-medium">
                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {selectedCase.customer.email}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {selectedCase.customer.phone}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Action 1: Confirm Payment */}
                  {selectedCase.status !== "recovered" && (
                    <button
                      onClick={triggerConfirmPayment}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs rounded-lg transition-colors shadow-sm shadow-emerald-500/10"
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
                      className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-lg transition-colors border ${
                        selectedCase.status === "paused"
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs"
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
                <div className="w-1/2 p-6 border-r border-slate-200 overflow-y-auto space-y-6 bg-white">
                  {/* AI Diagnosis block */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" /> AI Diagnostic Report
                    </div>
                    <div className="text-xs font-bold text-slate-700">Root Cause:</div>
                    <p className="text-slate-600 text-xs mt-0.5 font-medium leading-relaxed">{selectedCase.root_cause}</p>
                    
                    {selectedCase.promise_to_pay_date && (
                      <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-900">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <div className="text-[10px] font-bold">
                          Promise to Pay: {new Date(selectedCase.promise_to_pay_date).toDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audit Timeline */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Recovery Logs & Audit Trail
                    </h3>
                    <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-5">
                      {auditLogs.map((log) => (
                        <div key={log._id} className="relative">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border ${
                            log.compliance_check
                              ? "bg-blue-600 border-blue-400"
                              : log.action.includes("Success")
                              ? "bg-emerald-600 border-emerald-400"
                              : "bg-slate-400 border-slate-300"
                          }`}></div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span className="font-bold uppercase text-[9px] text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              {log.action}
                            </span>
                          </div>
                          <p className="text-slate-700 text-xs mt-1 leading-relaxed">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulation Chat Box */}
                <div className="w-1/2 flex flex-col overflow-hidden bg-slate-50/60">
                  {/* Messages list */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {selectedCase.conversations.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-3">
                        <MessageSquare className="h-8 w-8 text-slate-400 mb-1" />
                        <span>No communication drafts sent yet.</span>
                        <button
                          onClick={triggerOutreach}
                          disabled={actionLoading}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm shadow-blue-500/10 transition-colors"
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
                            <div className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wider">
                              {isAgent ? "AI recovery agent" : "customer reply"}
                            </div>
                            <div 
                              className={`p-3 rounded-xl text-xs leading-relaxed shadow-2xs ${
                                isAgent 
                                  ? "bg-white border border-slate-200 text-slate-800 rounded-tl-none" 
                                  : "bg-blue-600 text-white font-medium rounded-tr-none"
                              }`}
                            >
                              {msg.message}
                            </div>
                            <span className="text-[8px] text-slate-400 font-mono mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input form */}
                  {selectedCase.status !== "recovered" && selectedCase.status !== "paused" && (
                    <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                      <form onSubmit={simulateCustomerMessage} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Simulate customer message reply..."
                          value={customReply}
                          onChange={(e) => setCustomReply(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                        />
                        <button
                          type="submit"
                          disabled={actionLoading || !customReply.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-lg transition-colors shadow-sm shadow-blue-500/10"
                        >
                          Simulate Reply
                        </button>
                      </form>
                      
                      <div className="flex justify-between items-center mt-2.5 px-1">
                        <span className="text-[10px] text-slate-500 font-medium">Escalation Stage: {selectedCase.escalation_stage} / 3</span>
                        <button
                          type="button"
                          onClick={triggerOutreach}
                          disabled={actionLoading}
                          className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-bold"
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
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-400 bg-white">
              <ShieldAlert className="h-10 w-10 text-slate-300 mb-2" />
              Select a failure case on the left to see audit details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

