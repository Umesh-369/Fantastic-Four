"use client";

import React from "react";
import {
  LayoutDashboard,
  FilePlus,
  Users,
  Clock,
  Sliders,
  Scale,
  Activity,
  ShieldCheck,
  FileText,
  Settings,
  Sparkles,
  Leaf
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "new_app", label: "New Application", icon: FilePlus },
    { id: "applicants", label: "Applicants", icon: Users },
    { id: "history", label: "Decision History", icon: Clock },
    { id: "rules", label: "Rule Manager", icon: Sliders },
    { id: "fairness", label: "Fairness & Bias", icon: Scale },
    { id: "simulator", label: "Impact Simulator", icon: Activity },
    { id: "audit", label: "Audit Log", icon: ShieldCheck },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between min-h-screen py-6 px-4 shrink-0">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 px-3 mb-8 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
              Sahaj<span className="text-blue-600">Credit</span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 tracking-wide">
              More People. Brighter Futures.
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold shadow-sm shadow-blue-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Banner */}
      <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100/70 relative overflow-hidden">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-900 leading-snug">
              Financial opportunity for every story.
            </div>
            <div className="text-[10px] text-emerald-700 mt-1 font-medium">
              Data. Fairness. Trust. Inclusion.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
