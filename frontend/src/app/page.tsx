"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle, 
  ArrowRight, 
  Activity,
  FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import { api } from "@/utils/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const kpiRes = await api.getKPIs();
        const timelineRes = await api.getTimeline();
        const casesRes = await api.getCases();
        const logsRes = await api.getAuditLogs();

        setKpis(kpiRes.data);
        
        // Handle empty/mock timeline
        if (timelineRes.data && timelineRes.data.length > 0) {
          setTimeline(timelineRes.data);
        } else {
          // Fallback static chart layout
          setTimeline([
            { _id: "08-25", total: 10000, recovered: 3500 },
            { _id: "08-26", total: 15000, recovered: 7000 },
            { _id: "08-27", total: 8000, recovered: 4000 },
            { _id: "08-28", total: 22000, recovered: 12000 },
            { _id: "08-29", total: 12000, recovered: 9000 },
            { _id: "08-30", total: 19000, recovered: 14000 },
            { _id: "08-31", total: 25000, recovered: 18000 }
          ]);
        }

        setRecentCases(casesRes.data.slice(0, 5));
        setLogs(logsRes.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-blue-600">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Loading Recoveries...</span>
        </div>
      </div>
    );
  }

  // Prep chart data
  const chartColors = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];
  const typeData = kpis.typeStats.map((item: any, index: number) => ({
    name: item.type.replace('_', ' ').toUpperCase(),
    value: item.amount,
    color: chartColors[index % chartColors.length]
  }));

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Recovery Operations</h1>
          <p className="text-slate-500 mt-1 text-sm">Real-time revenue monitoring and autonomous outreach pipeline.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/batches"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm shadow-blue-500/20"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Upload Failure Batch
          </Link>
          <Link
            href="/playground"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-sm rounded-lg transition-colors shadow-2xs"
          >
            Agent Playground
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden shadow-xs hover:border-amber-300 hover:shadow-sm transition-all duration-200">
          <div className="absolute top-0 right-0 p-3 bg-amber-50 rounded-bl-xl border-l border-b border-amber-100">
            <DollarSign className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue at Risk</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{kpis.totalRevenueAtRisk.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-slate-400" />
            Total failures ingested
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all duration-200">
          <div className="absolute top-0 right-0 p-3 bg-emerald-50 rounded-bl-xl border-l border-b border-emerald-100">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recovered Revenue</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            ₹{kpis.totalRevenueRecovered.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-semibold">
            + {kpis.recoveredCases} successful cases
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-sm transition-all duration-200">
          <div className="absolute top-0 right-0 p-3 bg-blue-50 rounded-bl-xl border-l border-b border-blue-100">
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recovery Rate</div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">
            {kpis.recoveryRateAmount}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Weighted by transaction amount
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden shadow-xs hover:border-rose-300 hover:shadow-sm transition-all duration-200">
          <div className="absolute top-0 right-0 p-3 bg-rose-50 rounded-bl-xl border-l border-b border-rose-100">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Recovery / Active</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {kpis.statusStats.in_recovery + kpis.statusStats.pending}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Pending agent tasks
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Area Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-2 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-6">Revenue Recovery Timeline</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="_id" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#ffffff", 
                    borderColor: "#e2e8f0", 
                    color: "#0f172a",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="total" name="At Risk (INR)" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="recovered" name="Recovered (INR)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRecovered)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-6">Failures by Category</h3>
          <div className="h-80 flex flex-col justify-between">
            {typeData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={80} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#ffffff", 
                        borderColor: "#e2e8f0", 
                        color: "#0f172a",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                      }} 
                    />
                    <Bar dataKey="value" name="Amount (INR)" radius={[0, 4, 4, 0]}>
                      {typeData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">No category statistics.</div>
            )}
            
            {/* Visual indicators */}
            <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-2">
              {typeData.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[10px] text-slate-600 font-medium truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Recent cases & Audit logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Cases */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-2 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-900">Active Recovery Queue</h3>
            <Link href="/cases" className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
              View All Cases <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Type</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Root Cause</th>
                  <th className="px-4 py-3 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCases.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 text-xs">{c.customer.name}</div>
                      <div className="text-[10px] text-slate-500">{c.customer.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                        {c.case_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 text-xs">
                      ₹{c.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[150px] truncate">
                      {c.root_cause}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.status === "recovered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        c.status === "paused" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                        c.status === "failed" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Compliance Audit logs */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-6">Compliance Audit Log</h3>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log._id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded ${
                    log.compliance_check ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed mt-1">{log.details}</p>
                {log.case_id && (
                  <Link 
                    href="/playground" 
                    className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-semibold block mt-2"
                  >
                    Inspect conversation &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

