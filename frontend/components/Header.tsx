"use client";

import React, { useEffect, useState } from "react";
import { Search, Bell, ChevronDown, User } from "lucide-react";

export const Header: React.FC = () => {
  const [currentDateStr, setCurrentDateStr] = useState("Today, 24 Jan 2026");
  const [currentTimeStr, setCurrentTimeStr] = useState("10:24 AM");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateStr(`Today, ${now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`);
      setCurrentTimeStr(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-18 bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
      {/* Search Bar */}
      <div className="relative w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search applicants, application ID, or documents..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white"
        />
      </div>

      {/* Right User & Timestamp Info */}
      <div className="flex items-center space-x-6">
        {/* Date Time Indicator */}
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-slate-700">{currentDateStr}</div>
          <div className="text-[11px] font-medium text-slate-400">{currentTimeStr}</div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            AM
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 flex items-center">
              Aarav Mehta
              <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            </div>
            <div className="text-[10px] font-medium text-slate-400">Team Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
};
