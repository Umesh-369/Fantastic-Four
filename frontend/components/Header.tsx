"use client";

import React, { useEffect, useState } from "react";

export const Header: React.FC = () => {
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [currentTimeStr, setCurrentTimeStr] = useState("");

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
    <header className="h-18 bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-end sticky top-0 z-20">
      {/* Right Timestamp */}
      <div className="flex items-center space-x-5">
        {/* Date Time Indicator */}
        {currentDateStr && (
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-700">{currentDateStr}</div>
            <div className="text-[11px] font-medium text-slate-400">{currentTimeStr}</div>
          </div>
        )}
      </div>
    </header>
  );
};
