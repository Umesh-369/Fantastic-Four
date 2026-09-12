"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";

interface DecisionPreviewProps {
  decisionData: any | null;
  isLoading: boolean;
}

export const DecisionPreview: React.FC<DecisionPreviewProps> = ({
  decisionData,
  isLoading,
}) => {
  const score = decisionData?.risk_score;
  const decision = decisionData?.decision;
  const explanation = decisionData?.explanation;
  const auditId = decisionData?.audit_id;

  // Compute SVG gauge arc
  // Radius 70, stroke 12, start angle -180 deg to 0 deg
  const strokeDash = 220;
  const normalizedScore = score != null ? Math.min(Math.max(score, 0), 100) : 0;
  const strokeOffset = strokeDash - (strokeDash * normalizedScore) / 100;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Live Decision Preview
            </h3>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Ready</span>
          </div>
        </div>

        {/* Circular Gauge */}
        <div className="relative flex flex-col items-center justify-center my-6">
          <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
            {/* Background Arc */}
            <path
              d="M 15 80 A 65 65 0 0 1 145 80"
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Foreground Score Arc */}
            {score != null && (
              <path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke={
                  decision === "APPROVE"
                    ? "#10B981"
                    : decision === "REVIEW"
                    ? "#F59E0B"
                    : "#EF4444"
                }
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="220"
                strokeDashoffset={strokeOffset}
                className="transition-all duration-1000 ease-out"
              />
            )}
          </svg>

          {/* Central Score Display */}
          <div className="absolute top-10 flex flex-col items-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {score != null ? score.toFixed(1) : "--"}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Risk Score
            </span>
          </div>

          <div className="flex justify-between w-44 text-[10px] font-semibold text-slate-400 px-1 -mt-2">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        {/* Decision Result or Placeholder */}
        {decision ? (
          <div className="space-y-4">
            {/* Status Pill */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-slate-50">
              <span className="text-xs font-semibold text-slate-600">Decision Outcome</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  decision === "APPROVE"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : decision === "REVIEW"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}
              >
                {decision}
              </span>
            </div>

            {/* Explanation Rationale */}
            {explanation && (
              <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-100/70 space-y-2">
                <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
                  Model Explanation Drivers
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {explanation.summary_text}
                </p>

                {explanation.positive_factors?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {explanation.positive_factors.slice(0, 2).map((pf: string, i: number) => (
                      <div key={i} className="flex items-start text-[11px] text-emerald-800 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0 mt-0.5" />
                        <span>{pf}</span>
                      </div>
                    ))}
                  </div>
                )}

                {explanation.negative_factors?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {explanation.negative_factors.slice(0, 2).map((nf: string, i: number) => (
                      <div key={i} className="flex items-start text-[11px] text-rose-800 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mr-1.5 shrink-0 mt-0.5" />
                        <span>{nf}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Audit Chain Fingerprint */}
            {auditId && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[10px] text-slate-500 font-mono">
                <div className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                  <span>{auditId}</span>
                </div>
                <span className="text-emerald-600 font-semibold">Chained & Valid</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
            <p className="text-xs font-medium text-slate-500">
              Submit application to see real-time credit decision
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
