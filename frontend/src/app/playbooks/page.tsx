"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { 
  Save, 
  Volume2, 
  ShieldCheck, 
  Clock, 
  AlertCircle
} from "lucide-react";

export default function Playbooks() {
  const [playbook, setPlaybook] = useState<any>(null);
  const [tone, setTone] = useState("hinglish");
  const [stoppingRules, setStoppingRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [retrySequence, setRetrySequence] = useState<number[]>([]);
  const [newRetry, setNewRetry] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function loadPlaybook() {
    try {
      setLoading(true);
      const res = await api.getPlaybook();
      setPlaybook(res.data);
      setTone(res.data.tone);
      setStoppingRules(res.data.stopping_rules || []);
      setRetrySequence(res.data.retry_sequence || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaybook();
  }, []);

  const addStoppingRule = () => {
    if (newRule.trim() && !stoppingRules.includes(newRule.trim())) {
      setStoppingRules([...stoppingRules, newRule.trim().toLowerCase()]);
      setNewRule("");
    }
  };

  const removeStoppingRule = (rule: string) => {
    setStoppingRules(stoppingRules.filter(r => r !== rule));
  };

  const addRetryInterval = () => {
    const val = parseInt(newRetry);
    if (!isNaN(val) && val > 0) {
      setRetrySequence([...retrySequence, val].sort((a, b) => a - b));
      setNewRetry("");
    }
  };

  const removeRetryInterval = (index: number) => {
    setRetrySequence(retrySequence.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await api.updatePlaybook({
        tone,
        stopping_rules: stoppingRules,
        retry_sequence: retrySequence
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50 text-blue-600">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold tracking-wider text-slate-600">Loading Configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Playbook Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Configure AI agentic behaviors, compliance stopping thresholds, and retry timelines.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 shadow-xs">
        {/* Row 1: Outreach Tone */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Volume2 className="h-4 w-4 text-blue-600" />
              AI Agent Tone
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Select the conversational styling used by the recovery agent when drafting email, SMS, or WhatsApp chasers.
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "hinglish", label: "Hinglish (Recommended)", desc: "Friendly conversational Mix. Highest success rates for Indian markets." },
              { id: "formal", label: "Formal English", desc: "Traditional corporate invoice notices. Appropriate for enterprise B2B." },
              { id: "casual", label: "Casual English", desc: "Lighthearted helpful messaging with active customer support style." }
            ].map((item) => (
              <label 
                key={item.id}
                className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  tone === item.id 
                    ? "bg-blue-50/70 border-blue-500 ring-1 ring-blue-500 text-blue-900 shadow-xs" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <input 
                  type="radio" 
                  name="tone" 
                  value={item.id} 
                  checked={tone === item.id}
                  onChange={() => setTone(item.id)}
                  className="sr-only"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-1">{item.label}</div>
                  <div className="text-[10px] text-slate-500 leading-normal">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Row 2: Compliance Rules */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Compliance Stopping Rules
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Define keywords that trigger an immediate pause in the outreach sequence to ensure regulatory compliance and prevent customer harassment.
            </p>
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. stop, unsubscribe, do-not-call"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStoppingRule())}
                className="flex-grow bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
              />
              <button 
                type="button"
                onClick={addStoppingRule}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-lg transition-colors"
              >
                Add Rule
              </button>
            </div>

            {/* Keyword tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              {stoppingRules.map((rule) => (
                <span 
                  key={rule}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-lg font-medium"
                >
                  {rule}
                  <button 
                    type="button" 
                    onClick={() => removeStoppingRule(rule)}
                    className="hover:text-rose-900 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 flex gap-2">
              <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
              <span>If a customer replies with any of these keywords, the recovery status changes to <b>PAUSED</b>, and notifications stop immediately.</span>
            </div>
          </div>
        </div>

        {/* Row 3: Mandate Retry Sequencer */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              Mandate Retry Sequencer
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Define the intervals (in minutes) for recurring subscription payment retries. The agent sequences attempts relative to the original transaction fail stamp.
            </p>
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="Interval in minutes (e.g. 1440 for 24 hours)"
                value={newRetry}
                onChange={(e) => setNewRetry(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRetryInterval())}
                className="flex-grow bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
              />
              <button 
                type="button"
                onClick={addRetryInterval}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-lg transition-colors"
              >
                Add Interval
              </button>
            </div>

            {/* Intervals list */}
            <div className="flex flex-wrap gap-2 pt-1">
              {retrySequence.map((interval, idx) => (
                <span 
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded-lg font-mono font-bold"
                >
                  Attempt {idx + 1}: {interval >= 1440 ? `${(interval/1440).toFixed(1)}d` : interval >= 60 ? `${(interval/60).toFixed(1)}h` : `${interval}m`}
                  <button 
                    type="button" 
                    onClick={() => removeRetryInterval(idx)}
                    className="hover:text-blue-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save panel */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
        <span className="text-xs text-slate-500">Settings will be immediately applied to all active and incoming cases.</span>
        <div className="flex items-center gap-4">
          {success && (
            <span className="text-xs text-emerald-600 font-bold animate-fade-in">Playbook updated successfully!</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm rounded-lg transition-colors shadow-sm shadow-blue-500/15"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Playbook"}
          </button>
        </div>
      </div>
    </div>
  );
}

