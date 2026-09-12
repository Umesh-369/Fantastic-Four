"use client";

import React from "react";
import { Scale, FileText, ShieldCheck, HeartHandshake, ArrowRight, Leaf, Quote } from "lucide-react";

interface FeatureCardsProps {
  onNavigate: (tab: string) => void;
}

export const FeatureCards: React.FC<FeatureCardsProps> = ({ onNavigate }) => {
  const cards = [
    {
      title: "Fair & Unbiased",
      desc: "We measure and monitor fairness across all applicant groups.",
      linkText: "View Fairness Metrics →",
      icon: Scale,
      color: "emerald",
      tab: "fairness"
    },
    {
      title: "Fully Auditable",
      desc: "Every decision is recorded with a verifiable audit trail.",
      linkText: "Explore Audit Log →",
      icon: FileText,
      color: "blue",
      tab: "audit"
    },
    {
      title: "Regulation Ready",
      desc: "Versioned rules, historical replay and impact analysis built-in.",
      linkText: "Manage Rules →",
      icon: ShieldCheck,
      color: "teal",
      tab: "rules"
    },
    {
      title: "Real Impact",
      desc: "Expanding financial access for underserved communities.",
      linkText: "View Our Mission →",
      icon: HeartHandshake,
      color: "purple",
      tab: "dashboard"
    }
  ];

  return (
    <div className="mt-8 space-y-6">
      {/* 4 Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate(c.tab)}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-slate-700" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                  {c.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {c.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                <span>{c.linkText}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Quote */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-100/80 via-emerald-50/50 to-blue-50/50 border border-slate-200/70 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-slate-700 font-medium text-xs">
          <Quote className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="font-bold text-slate-900">&ldquo;Credit isn&apos;t just about the past. It&apos;s about potential.&rdquo;</strong>
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold">
          <span>— A fairer tomorrow, together.</span>
          <Leaf className="w-4 h-4 text-emerald-500" />
        </div>
      </div>
    </div>
  );
};
