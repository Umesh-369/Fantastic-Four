"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Lock,
  CheckCircle,
  Shield,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  IndianRupee,
  Phone
} from "lucide-react";

interface ApplicationWizardProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  formData,
  setFormData,
  onSubmit,
  isSubmitting
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateField = (field: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: val }));
    setValidationError(null);
  };

  const steps = [
    { num: 1, label: "Personal Details" },
    { num: 2, label: "Alternate Data" },
    { num: 3, label: "Review & Submit" },
    { num: 4, label: "Decision" },
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.full_name?.trim()) {
        setValidationError("Please enter the applicant's full name.");
        return;
      }
      if (!formData.monthly_income || Number(formData.monthly_income) <= 0) {
        setValidationError("Please enter a valid monthly income.");
        return;
      }
      if (!formData.phone_number?.trim() || formData.phone_number.trim().length < 10) {
        setValidationError("Please enter a valid 10-digit phone number.");
        return;
      }
      if (!formData.requested_loan_amount || Number(formData.requested_loan_amount) <= 0) {
        setValidationError("Please enter a valid requested loan amount.");
        return;
      }
    }
    setValidationError(null);
    setCurrentStep((s) => s + 1);
  };

  return (
    <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              New Credit Application
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter applicant details and get a credit decision in under 90 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between py-5 border-b border-slate-100 mb-6 overflow-x-auto">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center space-x-2 shrink-0">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep >= s.num
                  ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {s.num}
            </div>
            <span
              className={`text-xs font-medium ${
                currentStep === s.num ? "text-slate-900 font-semibold" : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div className="w-8 sm:w-12 h-[1px] bg-slate-200 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Main Grid: Form Inputs + "Why We Ask This" Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Area (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {currentStep === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={formData.full_name || ""}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Monthly Income (₹)
                </label>
                <input
                  type="number"
                  placeholder="Enter monthly income"
                  value={formData.monthly_income || ""}
                  onChange={(e) => updateField("monthly_income", parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.date_of_birth || ""}
                    onChange={(e) => updateField("date_of_birth", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Employment Type
                </label>
                <select
                  value={formData.employment_type || "gig"}
                  onChange={(e) => updateField("employment_type", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                >
                  <option value="gig">Gig Economy Worker</option>
                  <option value="salaried">Salaried Employee</option>
                  <option value="self_employed">Self-Employed / Small Business</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-semibold">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={formData.phone_number || ""}
                    onChange={(e) => updateField("phone_number", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Requested Loan Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="Enter loan amount"
                  value={formData.requested_loan_amount || ""}
                  onChange={(e) => updateField("requested_loan_amount", parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rent Payment Ratio (12m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="e.g. 0.95"
                  value={formData.rent_payment_ratio ?? ""}
                  onChange={(e) => updateField("rent_payment_ratio", e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Utility Payment Ratio
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="e.g. 0.92"
                  value={formData.utility_payment_ratio ?? ""}
                  onChange={(e) => updateField("utility_payment_ratio", e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Telecom Tenure (Months)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 36"
                  value={formData.telecom_tenure_months ?? ""}
                  onChange={(e) => updateField("telecom_tenure_months", e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bank Bounces (past 6m)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 0"
                  value={formData.bounce_count_6m ?? ""}
                  onChange={(e) => updateField("bounce_count_6m", e.target.value === "" ? "" : parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Monthly Bank Inflow (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 38000"
                  value={formData.monthly_bank_inflow ?? ""}
                  onChange={(e) => updateField("monthly_bank_inflow", e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Average Bank Balance (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 12000"
                  value={formData.avg_bank_balance ?? ""}
                  onChange={(e) => updateField("avg_bank_balance", e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </div>

              {formData.employment_type === "gig" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Gig Earnings Stability (0-1)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 0.85"
                      value={formData.gig_earnings_stability ?? ""}
                      onChange={(e) => updateField("gig_earnings_stability", e.target.value === "" ? "" : parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Gig Platform Rating (1-5)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 4.8"
                      value={formData.gig_rating ?? ""}
                      onChange={(e) => updateField("gig_rating", e.target.value === "" ? "" : parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {currentStep >= 3 && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Application Review Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Applicant:</span> <strong className="text-slate-700">{formData.full_name || "—"}</strong></div>
                <div><span className="text-slate-400">Monthly Income:</span> <strong className="text-slate-700">{formData.monthly_income ? `₹${Number(formData.monthly_income).toLocaleString()}` : "—"}</strong></div>
                <div><span className="text-slate-400">Loan Requested:</span> <strong className="text-slate-700">{formData.requested_loan_amount ? `₹${Number(formData.requested_loan_amount).toLocaleString()}` : "—"}</strong></div>
                <div><span className="text-slate-400">Segment:</span> <strong className="text-slate-700 capitalize">{formData.employment_type || "—"}</strong></div>
                <div><span className="text-slate-400">Rent Ratio:</span> <strong className="text-slate-700">{formData.rent_payment_ratio !== "" && formData.rent_payment_ratio != null ? `${(Number(formData.rent_payment_ratio)*100).toFixed(0)}%` : "—"}</strong></div>
                <div><span className="text-slate-400">Past Bounces:</span> <strong className="text-slate-700">{formData.bounce_count_6m !== "" && formData.bounce_count_6m != null ? formData.bounce_count_6m : "0"}</strong></div>
              </div>
            </div>
          )}

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {validationError}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                className="flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </button>
            ) : <div />}

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            ) : (
              <button
                disabled={isSubmitting}
                onClick={() => onSubmit(formData)}
                className="flex items-center space-x-2 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Evaluating Decision Flow...</span>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Info Box: "Why We Ask This?" (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-2xl p-5 border border-blue-100/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Why We Ask This?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 mb-5">
              We use rent payments, utility bills, telecom activity, cashflow patterns and other alternate data to evaluate creditworthiness — especially for first-time borrowers.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2.5 text-slate-700">
                <div className="w-5 h-5 rounded-full bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                  <Lock className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-medium">Secure & Encrypted</span>
              </div>

              <div className="flex items-center space-x-2.5 text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-medium">No Impact on Credit Score</span>
              </div>

              <div className="flex items-center space-x-2.5 text-slate-700">
                <div className="w-5 h-5 rounded-full bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                  <Shield className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-medium">Your Data Stays Private</span>
              </div>

              <div className="flex items-center space-x-2.5 text-slate-700">
                <div className="w-5 h-5 rounded-full bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-medium">Used Only for Credit Assessment</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-blue-100 text-[10px] text-slate-400 italic">
            Automated microservice decision loop executes in &lt; 90 seconds.
          </div>
        </div>
      </div>
    </div>
  );
};
