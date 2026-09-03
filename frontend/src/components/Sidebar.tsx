"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Layers, 
  ShieldAlert, 
  PlayCircle, 
  Settings, 
  TrendingUp,
  Coins
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Recovery Batches", href: "/batches", icon: Layers },
    { name: "Failure Cases", href: "/cases", icon: ShieldAlert },
    { name: "Agent Playground", href: "/playground", icon: PlayCircle },
    { name: "Playbook Settings", href: "/playbooks", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2">
        <Coins className="h-6 w-6 text-amber-500 animate-pulse" />
        <span className="font-bold text-lg tracking-wide text-white bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
          RazorRecover
        </span>
        <span className="text-[10px] bg-amber-500/20 text-amber-400 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
          AI
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-3 mb-3">
          Menu
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-xs text-slate-400 font-medium">AI Recovery Loop Active</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          Razorpay Buildathon v1.0
        </div>
      </div>
    </aside>
  );
}
