"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { 
  PlayCircle,
  MessageSquare,
  ShieldCheck,
  BrainCircuit,
  Coins,
  Send,
  AlertTriangle,
  HelpCircle,
  Clock,
  CheckCircle,
  UserCheck
} from "lucide-react";

export default function Playground() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [playbook, setPlaybook] = useState<any>(null);

  // Cognitive State logs for agent reasoning visualization
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);

  async function loadCases() {
    try {
      setLoading(true);
      const res = await api.getCases("in_recovery"); // load active cases
      setCases(res.data);
      if (res.data.length > 0 && !selectedCase) {
        handleSelectCase(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlaybook() {
    try {
      const res = await api.getPlaybook();
      setPlaybook(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadCases();
    loadPlaybook();
  }, []);

  const handleSelectCase = (kase: any) => {
    setSelectedCase(kase);
    setMessages(kase.conversations || []);
    // Reset agent reasoning log visualizer
    setAgentLogs([
      "System initialized.",
      `Playbook loaded: Tone set to "${playbook?.tone || 'hinglish'}".`,
      `Case loaded: customer ${kase.customer.name} owes ₹${kase.amount}.`,
      `Initial AI Diagnosis: "${kase.root_cause}".`
    ]);
    setLastAnalysis(null);
  };

  const triggerOutreach = async () => {
    if (!selectedCase) return;
    setSimulating(true);
    setAgentLogs(prev => [...prev, "Spawning AI agent process...", "Generating outreach message based on case root cause..."]);
    
    try {
      await api.generateOutreach(selectedCase._id);
      const res = await api.getCaseById(selectedCase._id);
      setSelectedCase(res.data);
      setMessages(res.data.conversations);
      setAgentLogs(prev => [
        ...prev,
        "AI reasoning completed.",
        `Outreach generated: Stage ${res.data.escalation_stage} message dispatched.`
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !replyText.trim()) return;

    const userText = replyText;
    setReplyText("");
    setSimulating(true);

    // 1. Add customer message to UI immediately for reactivity
    const updatedMsgs = [...messages, { sender: "customer", message: userText, timestamp: new Date() }];
    setMessages(updatedMsgs);

    // AI thinking timeline visualization steps
    setAgentLogs(prev => [
      ...prev,
      `Received customer reply: "${userText}"`,
      "Analyzing reply text against compliance stopping rules...",
    ]);

    try {
      // 2. Call backend to parse reply
      await api.customerReply(selectedCase._id, userText);
      const res = await api.getCaseById(selectedCase._id);
      
      // Let's create visual reasoning highlights
      const lowercaseUser = userText.toLowerCase();
      const matchedStop = playbook?.stopping_rules?.find((rule: string) => lowercaseUser.includes(rule));
      
      setTimeout(() => {
        setAgentLogs(prev => [
          ...prev,
          matchedStop 
            ? `⚠️ Alert: Matched stopping keyword "${matchedStop}". Triggering DND policy.` 
            : "Compliance check passed. Customer did not request stop.",
          "Parsing customer intent & sentiment..."
        ]);
      }, 500);

      setTimeout(() => {
        const isPromise = lowercaseUser.includes("pay") || lowercaseUser.includes("kal") || lowercaseUser.includes("parso") || lowercaseUser.includes("salary") || lowercaseUser.includes("promise");
        setLastAnalysis({
          opt_out: !!matchedStop,
          promise_to_pay: isPromise,
          promise_date: res.data.promise_to_pay_date,
          status: res.data.status,
          escalation_stage: res.data.escalation_stage
        });

        setAgentLogs(prev => [
          ...prev,
          isPromise 
            ? `📅 Intent detected: PROMISE-TO-PAY. Pausing sequence until promise date.` 
            : "Intent detected: GENERAL QUERY.",
          "Drafting response reply according to playbook tone...",
          "Response dispatched successfully."
        ]);

        setSelectedCase(res.data);
        setMessages(res.data.conversations);
        setSimulating(false);
      }, 1200);

    } catch (err) {
      console.error(err);
      setSimulating(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950 flex-1 flex flex-col h-full overflow-hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Agent Playground</h1>
        <p className="text-slate-400 mt-1">Simulate conversations with the recovery agent and visualize its cognitive compliance logic in real-time.</p>
      </div>

      <div className="flex-1 flex gap-8 min-h-0 overflow-hidden">
        {/* Pane 1: Selector */}
        <div className="w-1/4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-slate-800 shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active In-Recovery Cases</h3>
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 py-20 text-xs">
              <div className="h-6 w-6 border-2 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
          ) : cases.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6 text-xs text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
              No active recovery cases.<br/>All payments recovered or paused.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 flex-1">
              {cases.map((c) => (
                <div
                  key={c._id}
                  onClick={() => handleSelectCase(c)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedCase?._id === c._id
                      ? "bg-amber-500/5 border-l-4 border-l-amber-500"
                      : "hover:bg-slate-800/30 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="font-bold text-xs text-white truncate">{c.customer.name}</div>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                    <span>₹{c.amount.toLocaleString()}</span>
                    <span className="font-mono text-[9px] px-1 bg-slate-800 text-slate-300 rounded uppercase">
                      {c.case_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pane 2: Mock Messaging Screen */}
        <div className="w-2/5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 shrink-0 flex justify-between items-center">
            {selectedCase ? (
              <>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                    WhatsApp Sim: {selectedCase.customer.name}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Outreach Channel Active</span>
                </div>
                <div className="text-xs text-slate-400 font-bold">
                  ₹{selectedCase.amount.toLocaleString()}
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-500">No active simulator</span>
            )}
          </div>

          {/* Dialog list */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/40">
            {selectedCase ? (
              messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-slate-600 space-y-4">
                  <MessageSquare className="h-8 w-8 text-slate-700" />
                  <span>Interactive simulation ready. Send the first outreach message draft.</span>
                  <button
                    onClick={triggerOutreach}
                    disabled={simulating}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-amber-500/10 transition-colors"
                  >
                    Send Stage 0 Outreach Draft
                  </button>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isAgent = m.sender === "agent";
                  return (
                    <div key={i} className={`flex flex-col max-w-[85%] ${isAgent ? "mr-auto" : "ml-auto items-end"}`}>
                      <div className="text-[8px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                        {isAgent ? "AI recovery agent" : "customer reply"}
                      </div>
                      <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                        isAgent ? "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none" : "bg-amber-500 text-slate-950 font-semibold rounded-tr-none"
                      }`}>
                        {m.message}
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-600">
                Select a case on the left to begin simulation.
              </div>
            )}
          </div>

          {/* Form message submission */}
          {selectedCase && messages.length > 0 && selectedCase.status !== 'paused' && selectedCase.status !== 'recovered' && (
            <form onSubmit={submitReply} className="p-4 border-t border-slate-800 bg-slate-950 shrink-0 flex gap-2">
              <input
                type="text"
                placeholder="Type customer reply (e.g. 'I will pay tomorrow' or 'stop calling')..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={simulating}
                className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
              />
              <button
                type="submit"
                disabled={simulating || !replyText.trim()}
                className="p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/30 text-slate-950 rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {/* Pane 3: Cognitive Dashboard */}
        <div className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 shrink-0">
            <BrainCircuit className="h-5 w-5 text-amber-500" />
            <h3 className="text-md font-bold text-white">AI Agent Core Cognition</h3>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 font-mono text-[10px] text-slate-400">
            {agentLogs.map((log, i) => (
              <div key={i} className="flex gap-2 items-start leading-relaxed border-l border-slate-800 pl-3">
                <span className="text-amber-500 shrink-0">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
            {simulating && (
              <div className="flex gap-2 items-center text-amber-500 pl-3 animate-pulse">
                <span>&gt; Thinking...</span>
              </div>
            )}
          </div>

          {/* Structured Analysis Highlights */}
          <div className="border-t border-slate-800 pt-4 mt-auto shrink-0 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Active Compliance States
            </h4>
            
            {lastAnalysis ? (
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-slate-500">Opt-out matched</div>
                  <div className={`font-bold mt-1 ${lastAnalysis.opt_out ? 'text-red-400' : 'text-emerald-400'}`}>
                    {lastAnalysis.opt_out ? "YES (Outreach Paused)" : "NO (Compliant)"}
                  </div>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-slate-500">Promise-to-Pay</div>
                  <div className={`font-bold mt-1 ${lastAnalysis.promise_to_pay ? 'text-purple-400' : 'text-slate-400'}`}>
                    {lastAnalysis.promise_to_pay ? "Detected" : "None"}
                  </div>
                </div>
                {lastAnalysis.promise_to_pay && lastAnalysis.promise_date && (
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg col-span-2 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-purple-400" />
                    <div>
                      <span className="text-slate-500">Snoozed until:</span>{" "}
                      <span className="font-bold text-purple-400 font-mono">
                        {new Date(lastAnalysis.promise_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg col-span-2">
                  <div className="text-slate-500">System Recovery State</div>
                  <div className="font-bold text-white mt-1 uppercase text-[10px]">
                    Status: <span className="text-amber-500">{lastAnalysis.status}</span> | Esc. Stage: <span className="text-amber-500">{lastAnalysis.escalation_stage}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-center text-slate-600 text-[10px]">
                Send messages inside simulator to run compliance parsers.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
