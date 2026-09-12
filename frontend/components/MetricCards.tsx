"use client";

import React from "react";
import { Users, CheckCircle, XCircle, Clock, Check, AlertTriangle } from "lucide-react";

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
  const total = metrics?.total_applications ?? 0;
  const approved = metrics?.approved_count ?? 0;
  const approvedPct = metrics?.approved_pct ?? 0;
  const rejected = metrics?.rejected_count ?? 0;
  const rejectedPct = metrics?.rejected_pct ?? 0;
  const reviewed = metrics?.review_count ?? 0;
  const reviewPct = metrics?.review_pct ?? 0;
  const avgTime = metrics?.avg_decision_time_sec ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
        <div className="flex items-center text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5"></span>
          <span>Live</span>
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

      {/* 3. Under Review */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {reviewed.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              Under Review
            </div>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-full">
          {reviewPct.toFixed(1)}%
        </div>
      </div>

      {/* 4. Rejected */}
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

      {/* 5. Average Decision Time */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {avgTime > 0 ? `${avgTime.toFixed(1)} sec` : "0 sec"}
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

