"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MetricCards } from "@/components/MetricCards";
import { ApplicationWizard } from "@/components/ApplicationWizard";
import { DecisionPreview } from "@/components/DecisionPreview";
import { FeatureCards } from "@/components/FeatureCards";
import { RuleManagerView } from "@/components/RuleManagerView";
import { FairnessView } from "@/components/FairnessView";
import { AuditView } from "@/components/AuditView";
import { ApplicantsView } from "@/components/ApplicantsView";
import { DecisionHistoryView } from "@/components/DecisionHistoryView";
import { ImpactSimulatorView } from "@/components/ImpactSimulatorView";
import { ReportsView } from "@/components/ReportsView";
import { SettingsView } from "@/components/SettingsView";

const emptyFormData = {
  full_name: "",
  date_of_birth: "",
  phone_number: "",
  employment_type: "gig",
  monthly_income: "",
  requested_loan_amount: "",
  rent_payment_ratio: "",
  utility_payment_ratio: "",
  telecom_payment_ratio: "",
  telecom_tenure_months: "",
  monthly_bank_inflow: "",
  monthly_bank_outflow: "",
  avg_bank_balance: "",
  bounce_count_6m: "",
  gig_monthly_earnings: "",
  gig_earnings_stability: "",
  gig_months_active: "",
  gig_rating: "",
  income_to_expense_ratio: "",
  payment_consistency: "",
  data_conflict_count: 0,
  fraud_risk_score: 0.04,
  missing_data_ratio: 0.0,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [formData, setFormData] = useState<any>(emptyFormData);
  const [decisionData, setDecisionData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live dashboard summary from Gateway
  const loadDashboardSummary = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/v1/dashboard/summary");
      if (res.ok) {
        setMetrics(await res.json());
      }
    } catch (e) {
      console.error("Dashboard summary fetch fallback:", e);
    }
  };

  useEffect(() => {
    loadDashboardSummary();
  }, []);

  const handleSubmitApplication = async (dataToSubmit: any) => {
    setIsSubmitting(true);
    try {
      const sanitized = {
        ...dataToSubmit,
        monthly_income: Number(dataToSubmit.monthly_income) || 0,
        requested_loan_amount: Number(dataToSubmit.requested_loan_amount) || 0,
        rent_payment_ratio:
          dataToSubmit.rent_payment_ratio !== "" && dataToSubmit.rent_payment_ratio != null
            ? Number(dataToSubmit.rent_payment_ratio)
            : 0.85,
        utility_payment_ratio:
          dataToSubmit.utility_payment_ratio !== "" && dataToSubmit.utility_payment_ratio != null
            ? Number(dataToSubmit.utility_payment_ratio)
            : 0.85,
        telecom_payment_ratio:
          dataToSubmit.telecom_payment_ratio !== "" && dataToSubmit.telecom_payment_ratio != null
            ? Number(dataToSubmit.telecom_payment_ratio)
            : 0.85,
        telecom_tenure_months:
          dataToSubmit.telecom_tenure_months !== "" && dataToSubmit.telecom_tenure_months != null
            ? Number(dataToSubmit.telecom_tenure_months)
            : 36,
        monthly_bank_inflow:
          dataToSubmit.monthly_bank_inflow !== "" && dataToSubmit.monthly_bank_inflow != null
            ? Number(dataToSubmit.monthly_bank_inflow)
            : Number(dataToSubmit.monthly_income) || 35000,
        monthly_bank_outflow:
          dataToSubmit.monthly_bank_outflow !== "" && dataToSubmit.monthly_bank_outflow != null
            ? Number(dataToSubmit.monthly_bank_outflow)
            : (Number(dataToSubmit.monthly_income) || 35000) * 0.6,
        avg_bank_balance:
          dataToSubmit.avg_bank_balance !== "" && dataToSubmit.avg_bank_balance != null
            ? Number(dataToSubmit.avg_bank_balance)
            : 10000,
        bounce_count_6m:
          dataToSubmit.bounce_count_6m !== "" && dataToSubmit.bounce_count_6m != null
            ? parseInt(dataToSubmit.bounce_count_6m)
            : 0,
        gig_monthly_earnings:
          dataToSubmit.gig_monthly_earnings !== "" && dataToSubmit.gig_monthly_earnings != null
            ? Number(dataToSubmit.gig_monthly_earnings)
            : dataToSubmit.employment_type === "gig"
            ? Number(dataToSubmit.monthly_income) || 25000
            : 0,
        gig_earnings_stability:
          dataToSubmit.gig_earnings_stability !== "" && dataToSubmit.gig_earnings_stability != null
            ? Number(dataToSubmit.gig_earnings_stability)
            : 0.85,
        gig_months_active:
          dataToSubmit.gig_months_active !== "" && dataToSubmit.gig_months_active != null
            ? Number(dataToSubmit.gig_months_active)
            : 24,
        gig_rating:
          dataToSubmit.gig_rating !== "" && dataToSubmit.gig_rating != null
            ? Number(dataToSubmit.gig_rating)
            : 4.5,
      };

      const res = await fetch("http://127.0.0.1:8000/v1/decisions/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized),
      });
      if (res.ok) {
        const result = await res.json();
        setDecisionData(result);
        await loadDashboardSummary();
      } else {
        alert("Evaluation failed: " + (await res.text()));
      }
    } catch (e: any) {
      alert("Error submitting application: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Navigation - Static on left */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-8 max-w-7xl mx-auto w-full">
          {activeTab === "applicants" && (
            <ApplicantsView
              onSelectApplicant={(app) => {
                setFormData({ ...emptyFormData, ...app });
                setActiveTab("new_app");
              }}
            />
          )}
          {activeTab === "history" && <DecisionHistoryView />}
          {activeTab === "rules" && <RuleManagerView />}
          {activeTab === "fairness" && <FairnessView />}
          {activeTab === "simulator" && <ImpactSimulatorView />}
          {activeTab === "audit" && <AuditView />}
          {activeTab === "reports" && <ReportsView />}
          {activeTab === "settings" && <SettingsView />}

          {(activeTab === "dashboard" || activeTab === "new_app") && (
            <>
              {/* Hero Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-emerald-50/80 border border-slate-200/80 p-8 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Credit for{" "}
                    <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                      Real Lives
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-800 mt-2">
                    Explainable. Fair. Reproducible.
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-xl">
                    We use alternate data to assess creditworthiness for thin-file borrowers — and maintain a verifiable record of every decision, today and years later.
                  </p>
                </div>

                {/* Right Decorative Graphic Pill */}
                <div className="hidden lg:flex items-center space-x-3 bg-white/80 backdrop-blur-xs px-5 py-3 rounded-2xl border border-white/60 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    🌱
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      Same Dreams.
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-600">
                      More Possibilities.
                    </div>
                  </div>
                </div>
              </div>

              {/* Top 4 KPI Metric Cards */}
              <MetricCards metrics={metrics} />

              {/* Main Underwriting Grid: Wizard (Left) + Live Preview (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8">
                  <ApplicationWizard
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleSubmitApplication}
                    isSubmitting={isSubmitting}
                  />
                </div>

                <div className="lg:col-span-4 sticky top-24">
                  <DecisionPreview
                    decisionData={decisionData}
                    isLoading={isSubmitting}
                  />
                </div>
              </div>

              {/* Bottom Feature Cards */}
              <FeatureCards onNavigate={(tab) => setActiveTab(tab)} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
