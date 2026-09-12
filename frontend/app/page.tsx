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
  income_to_expense_ratio: 1.5,
  payment_consistency: 0.88,
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
    // Pre-flight check on required fields
    if (!dataToSubmit.full_name?.trim() || dataToSubmit.full_name.trim().length < 2) {
      alert("Please provide a valid applicant full name (at least 2 characters).");
      return;
    }
    const phone = (dataToSubmit.phone_number || "").trim();
    if (!/^[0-9]{10}$/.test(phone)) {
      alert("Please provide a valid 10-digit Indian phone number.");
      return;
    }
    const income = Number(dataToSubmit.monthly_income);
    if (!income || income <= 0) {
      alert("Please enter a valid monthly income greater than 0.");
      return;
    }
    const loan = Number(dataToSubmit.requested_loan_amount);
    if (!loan || loan <= 0) {
      alert("Please enter a valid requested loan amount greater than 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitized: Record<string, any> = {
        full_name: dataToSubmit.full_name.trim(),
        phone_number: phone,
        employment_type: dataToSubmit.employment_type || "gig",
        monthly_income: income,
        requested_loan_amount: loan,
      };

      if (dataToSubmit.date_of_birth) {
        sanitized.date_of_birth = dataToSubmit.date_of_birth;
      }

      // Alternate data fields: only use defaults when field was left empty
      sanitized.rent_payment_ratio =
        dataToSubmit.rent_payment_ratio !== "" && dataToSubmit.rent_payment_ratio != null
          ? Number(dataToSubmit.rent_payment_ratio)
          : 0.85;

      sanitized.utility_payment_ratio =
        dataToSubmit.utility_payment_ratio !== "" && dataToSubmit.utility_payment_ratio != null
          ? Number(dataToSubmit.utility_payment_ratio)
          : 0.85;

      sanitized.telecom_payment_ratio =
        dataToSubmit.telecom_payment_ratio !== "" && dataToSubmit.telecom_payment_ratio != null
          ? Number(dataToSubmit.telecom_payment_ratio)
          : 0.85;

      sanitized.telecom_tenure_months =
        dataToSubmit.telecom_tenure_months !== "" && dataToSubmit.telecom_tenure_months != null
          ? Number(dataToSubmit.telecom_tenure_months)
          : 36.0;

      sanitized.monthly_bank_inflow =
        dataToSubmit.monthly_bank_inflow !== "" && dataToSubmit.monthly_bank_inflow != null
          ? Number(dataToSubmit.monthly_bank_inflow)
          : income;

      sanitized.monthly_bank_outflow =
        dataToSubmit.monthly_bank_outflow !== "" && dataToSubmit.monthly_bank_outflow != null
          ? Number(dataToSubmit.monthly_bank_outflow)
          : income * 0.6;

      sanitized.avg_bank_balance =
        dataToSubmit.avg_bank_balance !== "" && dataToSubmit.avg_bank_balance != null
          ? Number(dataToSubmit.avg_bank_balance)
          : 10000.0;

      sanitized.bounce_count_6m =
        dataToSubmit.bounce_count_6m !== "" && dataToSubmit.bounce_count_6m != null
          ? parseInt(dataToSubmit.bounce_count_6m)
          : 0;

      sanitized.gig_monthly_earnings =
        dataToSubmit.gig_monthly_earnings !== "" && dataToSubmit.gig_monthly_earnings != null
          ? Number(dataToSubmit.gig_monthly_earnings)
          : (dataToSubmit.employment_type === "gig" ? income : 0.0);

      sanitized.gig_earnings_stability =
        dataToSubmit.gig_earnings_stability !== "" && dataToSubmit.gig_earnings_stability != null
          ? Number(dataToSubmit.gig_earnings_stability)
          : 0.85;

      sanitized.gig_months_active =
        dataToSubmit.gig_months_active !== "" && dataToSubmit.gig_months_active != null
          ? Number(dataToSubmit.gig_months_active)
          : 24.0;

      sanitized.gig_rating =
        dataToSubmit.gig_rating !== "" && dataToSubmit.gig_rating != null
          ? Number(dataToSubmit.gig_rating)
          : 4.5;

      sanitized.income_to_expense_ratio =
        dataToSubmit.income_to_expense_ratio !== "" && dataToSubmit.income_to_expense_ratio != null
          ? Number(dataToSubmit.income_to_expense_ratio)
          : (sanitized.monthly_bank_outflow > 0
            ? Number((sanitized.monthly_bank_inflow / sanitized.monthly_bank_outflow).toFixed(2))
            : 1.5);

      sanitized.payment_consistency =
        dataToSubmit.payment_consistency !== "" && dataToSubmit.payment_consistency != null
          ? Number(dataToSubmit.payment_consistency)
          : Number(((sanitized.rent_payment_ratio + sanitized.utility_payment_ratio + sanitized.telecom_payment_ratio) / 3).toFixed(2));

      sanitized.data_conflict_count =
        dataToSubmit.data_conflict_count !== "" && dataToSubmit.data_conflict_count != null
          ? parseInt(dataToSubmit.data_conflict_count)
          : 0;

      sanitized.fraud_risk_score =
        dataToSubmit.fraud_risk_score !== "" && dataToSubmit.fraud_risk_score != null
          ? Number(dataToSubmit.fraud_risk_score)
          : 0.04;

      sanitized.missing_data_ratio =
        dataToSubmit.missing_data_ratio !== "" && dataToSubmit.missing_data_ratio != null
          ? Number(dataToSubmit.missing_data_ratio)
          : 0.0;

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
        const errorData = await res.json().catch(() => null);
        if (res.status === 422 && errorData && errorData.detail) {
          const detailMsgs = Array.isArray(errorData.detail)
            ? errorData.detail.map((d: any) => `${d.loc?.slice(1).join(".") || "Field"}: ${d.msg}`).join("\n")
            : JSON.stringify(errorData.detail);
          alert("Input Validation Rejected (422):\n" + detailMsgs);
        } else {
          alert("Evaluation failed: " + (errorData?.detail || res.statusText));
        }
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
