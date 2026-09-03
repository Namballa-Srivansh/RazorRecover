"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { 
  Settings, 
  Save, 
  Volume2, 
  ShieldCheck, 
  Clock, 
  HelpCircle,
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
      <div className="flex-grow flex items-center justify-center bg-slate-950 text-amber-500">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider">Loading Configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-950 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Playbook Settings</h1>
        <p className="text-slate-400 mt-1">Configure AI agentic behaviors, compliance stopping thresholds, and retry timelines.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        {/* Row 1: Outreach Tone */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Volume2 className="h-4 w-4 text-amber-500" />
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
                    ? "bg-amber-500/5 border-amber-500 text-amber-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
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
                  <div className="text-xs font-bold text-white mb-1">{item.label}</div>
                  <div className="text-[10px] text-slate-500 leading-normal">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Row 2: Compliance Rules */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShieldCheck className="h-4 w-4 text-purple-500" />
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
                className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
              />
              <button 
                type="button"
                onClick={addStoppingRule}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg transition-colors"
              >
                Add Rule
              </button>
            </div>

            {/* Keyword tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {stoppingRules.map((rule) => (
                <span 
                  key={rule}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs rounded-lg"
                >
                  {rule}
                  <button 
                    type="button" 
                    onClick={() => removeStoppingRule(rule)}
                    className="hover:text-red-300 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-[10px] text-slate-500 flex gap-2">
              <AlertCircle className="h-4 w-4 text-slate-500 shrink-0" />
              <span>If a customer replies with any of these keywords, the recovery status changes to <b>PAUSED</b>, and notifications stop.</span>
            </div>
          </div>
        </div>

        {/* Row 3: Mandate Retry Sequencer */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Clock className="h-4 w-4 text-blue-500" />
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
                className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
              />
              <button 
                type="button"
                onClick={addRetryInterval}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg transition-colors"
              >
                Add Interval
              </button>
            </div>

            {/* Intervals list */}
            <div className="flex flex-wrap gap-2 pt-2">
              {retrySequence.map((interval, idx) => (
                <span 
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs rounded-lg font-mono"
                >
                  Attempt {idx + 1}: {interval >= 1440 ? `${(interval/1440).toFixed(1)}d` : interval >= 60 ? `${(interval/60).toFixed(1)}h` : `${interval}m`}
                  <button 
                    type="button" 
                    onClick={() => removeRetryInterval(idx)}
                    className="hover:text-blue-300 font-bold"
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
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span className="text-xs text-slate-500">Settings will be immediately applied to all active and incoming cases.</span>
        <div className="flex items-center gap-4">
          {success && (
            <span className="text-xs text-emerald-400 font-semibold animate-fade-in">Playbook updated successfully!</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold text-sm rounded-lg transition-colors shadow-lg shadow-amber-500/15"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Playbook"}
          </button>
        </div>
      </div>
    </div>
  );
}
