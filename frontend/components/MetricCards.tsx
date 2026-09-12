"use client";

import React from "react";
import { Users, CheckCircle, XCircle, Clock, TrendingUp, Check } from "lucide-react";

interface MetricsData {
  total_applications: number;
  approved_count: number;
  approved_pct: number;
  rejected_count: number;
  rejected_pct: number;
  review_count: number;
  review_pct: number;
  avg_decision_time_sec: number;
}

interface MetricCardsProps {
  metrics: MetricsData | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  const total = metrics?.total_applications ?? 1248;
  const approved = metrics?.approved_count ?? 842;
  const approvedPct = metrics?.approved_pct ?? 67.5;
  const rejected = metrics?.rejected_count ?? 406;
  const rejectedPct = metrics?.rejected_pct ?? 32.5;
  const avgTime = metrics?.avg_decision_time_sec ?? 89.0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Applications */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {total.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              Total Applications
            </div>
          </div>
        </div>
        <div className="flex items-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
          <TrendingUp className="w-3 h-3 mr-1" />
          <span>12%</span>
        </div>
      </div>

      {/* 2. Approved */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {approved.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              Approved
            </div>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
          {approvedPct.toFixed(1)}%
        </div>
      </div>

      {/* 3. Rejected */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {rejected.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              Rejected
            </div>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-full">
          {rejectedPct.toFixed(1)}%
        </div>
      </div>

      {/* 4. Average Decision Time */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {Math.round(avgTime)} sec
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              Average Decision Time
            </div>
          </div>
        </div>
        <div className="flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
          <Check className="w-3 h-3 mr-1" />
          <span>Within 90s</span>
        </div>
      </div>
    </div>
  );
};
