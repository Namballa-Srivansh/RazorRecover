"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Layers, 
  ShieldAlert, 
  PlayCircle, 
  Settings, 
  Coins
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Recovery Batches", href: "/batches", icon: Layers },
    { name: "Failure Cases", href: "/cases", icon: ShieldAlert },
    { name: "Agent Playground", href: "/playground", icon: PlayCircle },
    { name: "Settings", href: "/playbooks", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 shadow-xs">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-2.5">
        <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-100">
          <Coins className="h-5 w-5 text-blue-600" />
        </div>
        <span className="font-extrabold text-lg tracking-tight text-slate-900">
          Razor<span className="text-blue-600">Recover</span>
        </span>
        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200/80 ml-auto">
          AI
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2">
          Platform Menu
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200/70 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent"
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform group-hover:scale-105 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs text-slate-700 font-semibold">AI Recovery Engine Active</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          Razorpay Buildathon v1.0
        </div>
      </div>
    </aside>
  );
}

