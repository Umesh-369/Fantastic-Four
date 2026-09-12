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
import { Sparkles } from "lucide-react";

const SAMPLE_PROFILES: Record<string, any> = {
  "Urban Gig Worker (Thin File)": {
    full_name: "Sunita Patil",
    date_of_birth: "1996-05-14",
    phone_number: "9876543210",
    employment_type: "gig",
    monthly_income: 38000,
    requested_loan_amount: 50000,
    rent_payment_ratio: 0.96,
    utility_payment_ratio: 0.94,
    telecom_payment_ratio: 0.95,
    telecom_tenure_months: 48,
    monthly_bank_inflow: 42000,
    monthly_bank_outflow: 24000,
    avg_bank_balance: 16000,
    bounce_count_6m: 0,
    gig_monthly_earnings: 32000,
    gig_earnings_stability: 0.91,
    gig_months_active: 36,
    gig_rating: 4.85,
    income_to_expense_ratio: 1.75,
    payment_consistency: 0.95,
    data_conflict_count: 0,
    fraud_risk_score: 0.03,
    missing_data_ratio: 0.0,
  },
  "E-Commerce Delivery Partner": {
    full_name: "Aarav Sharma",
    date_of_birth: "1998-11-03",
    phone_number: "9823456789",
    employment_type: "gig",
    monthly_income: 28000,
    requested_loan_amount: 30000,
    rent_payment_ratio: 0.90,
    utility_payment_ratio: 0.88,
    telecom_payment_ratio: 0.92,
    telecom_tenure_months: 36,
    monthly_bank_inflow: 31000,
    monthly_bank_outflow: 20000,
    avg_bank_balance: 9000,
    bounce_count_6m: 0,
    gig_monthly_earnings: 26000,
    gig_earnings_stability: 0.82,
    gig_months_active: 24,
    gig_rating: 4.65,
    income_to_expense_ratio: 1.55,
    payment_consistency: 0.90,
    data_conflict_count: 0,
    fraud_risk_score: 0.05,
    missing_data_ratio: 0.0,
  },
  "High-Risk Borderline Applicant": {
    full_name: "Vikram Das",
    date_of_birth: "1991-04-12",
    phone_number: "9711223344",
    employment_type: "self_employed",
    monthly_income: 18000,
    requested_loan_amount: 75000,
    rent_payment_ratio: 0.62,
    utility_payment_ratio: 0.65,
    telecom_payment_ratio: 0.70,
    telecom_tenure_months: 14,
    monthly_bank_inflow: 20000,
    monthly_bank_outflow: 21000,
    avg_bank_balance: 1800,
    bounce_count_6m: 3,
    gig_monthly_earnings: 0,
    gig_earnings_stability: 0.40,
    gig_months_active: 0,
    gig_rating: 3.5,
    income_to_expense_ratio: 0.95,
    payment_consistency: 0.64,
    data_conflict_count: 2,
    fraud_risk_score: 0.28,
    missing_data_ratio: 0.15,
  },
  "Salaried Junior Executive": {
    full_name: "Neha Kapoor",
    date_of_birth: "1997-09-25",
    phone_number: "9988776655",
    employment_type: "salaried",
    monthly_income: 42000,
    requested_loan_amount: 60000,
    rent_payment_ratio: 0.98,
    utility_payment_ratio: 0.95,
    telecom_payment_ratio: 0.98,
    telecom_tenure_months: 50,
    monthly_bank_inflow: 45000,
    monthly_bank_outflow: 25000,
    avg_bank_balance: 22000,
    bounce_count_6m: 0,
    gig_monthly_earnings: 0,
    gig_earnings_stability: 0.95,
    gig_months_active: 0,
    gig_rating: 5.0,
    income_to_expense_ratio: 1.80,
    payment_consistency: 0.97,
    data_conflict_count: 0,
    fraud_risk_score: 0.02,
    missing_data_ratio: 0.0,
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedSample, setSelectedSample] = useState("Urban Gig Worker (Thin File)");
  const [formData, setFormData] = useState<any>(SAMPLE_PROFILES["Urban Gig Worker (Thin File)"]);
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

  const handleLoadSample = (sampleType: string) => {
    setSelectedSample(sampleType);
    if (SAMPLE_PROFILES[sampleType]) {
      setFormData({ ...SAMPLE_PROFILES[sampleType] });
    }
  };

  const handleSubmitApplication = async (dataToSubmit: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/v1/decisions/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
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
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-8 max-w-7xl mx-auto w-full">
          {activeTab === "rules" && <RuleManagerView />}
          {activeTab === "fairness" && <FairnessView />}
          {activeTab === "audit" && <AuditView />}

          {(activeTab === "dashboard" || activeTab === "new_app") && (
            <>
              {/* Hero Banner matching screenshot */}
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
                    onLoadSample={handleLoadSample}
                    isSubmitting={isSubmitting}
                  />
                </div>

                <div className="lg:col-span-4 sticky top-24">
                  <DecisionPreview
                    decisionData={decisionData}
                    selectedSample={selectedSample}
                    setSelectedSample={setSelectedSample}
                    onLoadSample={handleLoadSample}
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
