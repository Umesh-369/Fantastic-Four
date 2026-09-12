"use client";

import React, { useState, useMemo } from "react";
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
  Phone,
  AlertCircle
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touchField = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const updateField = (field: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: val }));
    touchField(field);
  };

  // Safe dates for age validation (18 to 100 years old)
  const today = new Date();
  const maxDobDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minDobDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const maxDobStr = maxDobDate.toISOString().split("T")[0];
  const minDobStr = minDobDate.toISOString().split("T")[0];

  // Key-level input blockers
  const blockDisallowedPhoneKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "Enter", "Home", "End"];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    // Only digits 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    // Block 11th digit from being entered if no text is highlighted/selected
    const target = e.target as HTMLInputElement;
    const currentLen = (target.value || "").length;
    const selectionLen = (target.selectionEnd || 0) - (target.selectionStart || 0);
    if (currentLen >= 10 && selectionLen === 0) {
      e.preventDefault();
    }
  };

  const blockPositiveNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const blockIntegerKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Field validation rules
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    // Step 1: Personal Details
    // 1. Full name: min 2, max 100, letters/spaces/hyphens/dots/apostrophes
    const name = (formData.full_name || "").trim();
    if (!name) {
      errs.full_name = "Full name is required.";
    } else if (name.length < 2) {
      errs.full_name = "Full name must be at least 2 characters.";
    } else if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
      errs.full_name = "Full name can only contain letters, spaces, and punctuation (.'-).";
    }

    // 2. Monthly income: positive float, max 10,000,000
    const income = formData.monthly_income;
    if (income === "" || income === undefined || income === null) {
      errs.monthly_income = "Monthly income is required.";
    } else {
      const numInc = Number(income);
      if (isNaN(numInc) || numInc <= 0) {
        errs.monthly_income = "Monthly income must be greater than ₹0.";
      } else if (numInc > 10000000) {
        errs.monthly_income = "Monthly income cannot exceed ₹1,00,00,000.";
      }
    }

    // 3. Date of birth: valid date, age >= 18 and <= 120
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      if (isNaN(dob.getTime())) {
        errs.date_of_birth = "Please enter a valid date (YYYY-MM-DD).";
      } else {
        const age = today.getFullYear() - dob.getFullYear() - (
          (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) ? 1 : 0
        );
        if (age < 18) {
          errs.date_of_birth = "Applicant must be at least 18 years old.";
        } else if (age > 120 || dob > today) {
          errs.date_of_birth = "Date of birth out of realistic range.";
        }
      }
    }

    // 4. Phone number: exactly 10 digits
    const phone = formData.phone_number || "";
    if (!phone.trim()) {
      errs.phone_number = "Phone number is required.";
    } else if (phone.length !== 10) {
      errs.phone_number = `Mobile number must be exactly 10 digits (${phone.length}/10).`;
    } else if (!/^[0-9]{10}$/.test(phone)) {
      errs.phone_number = "Mobile number must contain digits only.";
    }

    // 5. Requested loan amount: positive float, max 10,000,000
    const loan = formData.requested_loan_amount;
    if (loan === "" || loan === undefined || loan === null) {
      errs.requested_loan_amount = "Loan amount is required.";
    } else {
      const numLoan = Number(loan);
      if (isNaN(numLoan) || numLoan <= 0) {
        errs.requested_loan_amount = "Loan amount must be greater than ₹0.";
      } else if (numLoan > 10000000) {
        errs.requested_loan_amount = "Loan amount cannot exceed ₹1,00,00,000.";
      }
    }

    // Step 2: Alternate Data
    // Rent ratio: 0.0 to 1.0
    if (formData.rent_payment_ratio !== "" && formData.rent_payment_ratio != null) {
      const r = Number(formData.rent_payment_ratio);
      if (isNaN(r) || r < 0 || r > 1) {
        errs.rent_payment_ratio = "Ratio must be between 0.00 and 1.00 (0% - 100%).";
      }
    }

    // Utility ratio: 0.0 to 1.0
    if (formData.utility_payment_ratio !== "" && formData.utility_payment_ratio != null) {
      const u = Number(formData.utility_payment_ratio);
      if (isNaN(u) || u < 0 || u > 1) {
        errs.utility_payment_ratio = "Ratio must be between 0.00 and 1.00.";
      }
    }

    // Telecom tenure: 0 to 600 months
    if (formData.telecom_tenure_months !== "" && formData.telecom_tenure_months != null) {
      const t = Number(formData.telecom_tenure_months);
      if (isNaN(t) || t < 0 || t > 600 || !Number.isInteger(t)) {
        errs.telecom_tenure_months = "Tenure must be an integer between 0 and 600 months.";
      }
    }

    // Bounces: 0 to 50
    if (formData.bounce_count_6m !== "" && formData.bounce_count_6m != null) {
      const b = Number(formData.bounce_count_6m);
      if (isNaN(b) || b < 0 || b > 50 || !Number.isInteger(b)) {
        errs.bounce_count_6m = "Bounce count must be an integer between 0 and 50.";
      }
    }

    // Inflow: >= 0
    if (formData.monthly_bank_inflow !== "" && formData.monthly_bank_inflow != null) {
      const inf = Number(formData.monthly_bank_inflow);
      if (isNaN(inf) || inf < 0) {
        errs.monthly_bank_inflow = "Monthly inflow cannot be negative.";
      }
    }

    // Avg balance: >= 0
    if (formData.avg_bank_balance !== "" && formData.avg_bank_balance != null) {
      const bal = Number(formData.avg_bank_balance);
      if (isNaN(bal) || bal < 0) {
        errs.avg_bank_balance = "Average balance cannot be negative.";
      }
    }

    // Gig fields if employment_type === "gig"
    if (formData.employment_type === "gig") {
      if (formData.gig_earnings_stability !== "" && formData.gig_earnings_stability != null) {
        const s = Number(formData.gig_earnings_stability);
        if (isNaN(s) || s < 0 || s > 1) {
          errs.gig_earnings_stability = "Stability index must be between 0.00 and 1.00.";
        }
      }
      if (formData.gig_rating !== "" && formData.gig_rating != null) {
        const gr = Number(formData.gig_rating);
        if (isNaN(gr) || gr < 1.0 || gr > 5.0) {
          errs.gig_rating = "Rating must be between 1.0 and 5.0.";
        }
      }
    }

    return errs;
  }, [formData, today]);

  const isStep1Valid = !errors.full_name && !errors.monthly_income && !errors.phone_number && !errors.requested_loan_amount && !errors.date_of_birth;
  const isStep2Valid = !errors.rent_payment_ratio && !errors.utility_payment_ratio && !errors.telecom_tenure_months && !errors.bounce_count_6m && !errors.monthly_bank_inflow && !errors.avg_bank_balance && !errors.gig_earnings_stability && !errors.gig_rating;
  const isFormValid = isStep1Valid && isStep2Valid;

  const markStep1Touched = () => {
    setTouched((prev) => ({
      ...prev,
      full_name: true,
      monthly_income: true,
      phone_number: true,
      requested_loan_amount: true,
      date_of_birth: true,
    }));
  };

  const markStep2Touched = () => {
    setTouched((prev) => ({
      ...prev,
      rent_payment_ratio: true,
      utility_payment_ratio: true,
      telecom_tenure_months: true,
      bounce_count_6m: true,
      monthly_bank_inflow: true,
      avg_bank_balance: true,
      gig_earnings_stability: true,
      gig_rating: true,
    }));
  };

  const steps = [
    { num: 1, label: "Personal Details" },
    { num: 2, label: "Alternate Data" },
    { num: 3, label: "Review & Submit" },
    { num: 4, label: "Decision" },
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      markStep1Touched();
      if (!isStep1Valid) {
        return;
      }
    } else if (currentStep === 2) {
      markStep2Touched();
      if (!isStep2Valid) {
        return;
      }
    }
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
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  maxLength={100}
                  value={formData.full_name || ""}
                  onBlur={() => touchField("full_name")}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^a-zA-Z\s.'-]/g, "").slice(0, 100);
                    updateField("full_name", raw);
                  }}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                    touched.full_name && errors.full_name
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {touched.full_name && errors.full_name && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.full_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Monthly Income (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter monthly income"
                  min="1"
                  max="10000000"
                  value={formData.monthly_income || ""}
                  onKeyDown={blockPositiveNumericKeys}
                  onBlur={() => touchField("monthly_income")}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                    updateField("monthly_income", val);
                  }}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                    touched.monthly_income && errors.monthly_income
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {touched.monthly_income && errors.monthly_income && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.monthly_income}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  max={maxDobStr}
                  min={minDobStr}
                  value={formData.date_of_birth || ""}
                  onBlur={() => touchField("date_of_birth")}
                  onChange={(e) => updateField("date_of_birth", e.target.value)}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                    touched.date_of_birth && errors.date_of_birth
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {touched.date_of_birth && errors.date_of_birth && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.date_of_birth}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Employment Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.employment_type || "gig"}
                  onChange={(e) => updateField("employment_type", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="gig">Gig Economy Worker</option>
                  <option value="salaried">Salaried Employee</option>
                  <option value="self_employed">Self-Employed / Small Business</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-semibold">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={formData.phone_number || ""}
                    onKeyDown={blockDisallowedPhoneKeys}
                    onBlur={() => touchField("phone_number")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                      updateField("phone_number", raw);
                    }}
                    className={`w-full bg-slate-50 border rounded-r-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                      touched.phone_number && errors.phone_number
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-200 focus:border-blue-500"
                    }`}
                  />
                </div>
                {touched.phone_number && errors.phone_number && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.phone_number}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Requested Loan Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter loan amount"
                  min="1"
                  max="10000000"
                  value={formData.requested_loan_amount || ""}
                  onKeyDown={blockPositiveNumericKeys}
                  onBlur={() => touchField("requested_loan_amount")}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                    updateField("requested_loan_amount", val);
                  }}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                    touched.requested_loan_amount && errors.requested_loan_amount
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {touched.requested_loan_amount && errors.requested_loan_amount && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.requested_loan_amount}
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rent Payment Ratio (0.00 - 1.00)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="e.g. 0.95"
                  value={formData.rent_payment_ratio ?? ""}
                  onKeyDown={blockPositiveNumericKeys}
                  onBlur={() => touchField("rent_payment_ratio")}
                  onChange={(e) => updateField("rent_payment_ratio", e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                    touched.rent_payment_ratio && errors.rent_payment_ratio
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {touched.rent_payment_ratio && errors.rent_payment_ratio && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.rent_payment_ratio}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Utility Payment Ratio (0.00 - 1.00)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="e.g. 0.92"
                  value={formData.utility_payment_ratio ?? ""}
                  onKeyDown={blockPositiveNumericKeys}
                  onBlur={() => touchField("utility_payment_ratio")}
                  onChange={(e) => updateField("utility_payment_ratio", e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                    touched.utility_payment_ratio && errors.utility_payment_ratio
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {touched.utility_payment_ratio && errors.utility_payment_ratio && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.utility_payment_ratio}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Telecom Tenure (Months: 0 - 600)
                </label>
                <input
                  type="number"
                  min="0"
                  max="600"
                  step="1"
                  placeholder="e.g. 36"
                  value={formData.telecom_tenure_months ?? ""}
                  onKeyDown={blockIntegerKeys}
                  onBlur={() => touchField("telecom_tenure_months")}
                  onChange={(e) => updateField("telecom_tenure_months", e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                    touched.telecom_tenure_months && errors.telecom_tenure_months
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {touched.telecom_tenure_months && errors.telecom_tenure_months && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.telecom_tenure_months}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bank Bounces (past 6m: 0 - 50)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  placeholder="e.g. 0"
                  value={formData.bounce_count_6m ?? ""}
                  onKeyDown={blockIntegerKeys}
                  onBlur={() => touchField("bounce_count_6m")}
                  onChange={(e) => updateField("bounce_count_6m", e.target.value === "" ? "" : parseInt(e.target.value))}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                    touched.bounce_count_6m && errors.bounce_count_6m
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {touched.bounce_count_6m && errors.bounce_count_6m && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.bounce_count_6m}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Monthly Bank Inflow (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 38000"
                  value={formData.monthly_bank_inflow ?? ""}
                  onKeyDown={blockPositiveNumericKeys}
                  onBlur={() => touchField("monthly_bank_inflow")}
                  onChange={(e) => updateField("monthly_bank_inflow", e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                    touched.monthly_bank_inflow && errors.monthly_bank_inflow
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {touched.monthly_bank_inflow && errors.monthly_bank_inflow && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.monthly_bank_inflow}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Average Bank Balance (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 12000"
                  value={formData.avg_bank_balance ?? ""}
                  onKeyDown={blockPositiveNumericKeys}
                  onBlur={() => touchField("avg_bank_balance")}
                  onChange={(e) => updateField("avg_bank_balance", e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                    touched.avg_bank_balance && errors.avg_bank_balance
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {touched.avg_bank_balance && errors.avg_bank_balance && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                    {errors.avg_bank_balance}
                  </p>
                )}
              </div>

              {formData.employment_type === "gig" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Gig Earnings Stability (0.00 - 1.00)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="e.g. 0.85"
                      value={formData.gig_earnings_stability ?? ""}
                      onKeyDown={blockPositiveNumericKeys}
                      onBlur={() => touchField("gig_earnings_stability")}
                      onChange={(e) => updateField("gig_earnings_stability", e.target.value === "" ? "" : parseFloat(e.target.value))}
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                        touched.gig_earnings_stability && errors.gig_earnings_stability
                          ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                          : "border-slate-200 focus:border-blue-500"
                      }`}
                    />
                    {touched.gig_earnings_stability && errors.gig_earnings_stability && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                        <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                        {errors.gig_earnings_stability}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Gig Platform Rating (1.0 - 5.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      placeholder="e.g. 4.8"
                      value={formData.gig_rating ?? ""}
                      onKeyDown={blockPositiveNumericKeys}
                      onBlur={() => touchField("gig_rating")}
                      onChange={(e) => updateField("gig_rating", e.target.value === "" ? "" : parseFloat(e.target.value))}
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                        touched.gig_rating && errors.gig_rating
                          ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                          : "border-slate-200 focus:border-blue-500"
                      }`}
                    />
                    {touched.gig_rating && errors.gig_rating && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                        <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                        {errors.gig_rating}
                      </p>
                    )}
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
                <div><span className="text-slate-400">Phone:</span> <strong className="text-slate-700">+91 {formData.phone_number || "—"}</strong></div>
                <div><span className="text-slate-400">Rent Ratio:</span> <strong className="text-slate-700">{formData.rent_payment_ratio !== "" && formData.rent_payment_ratio != null ? `${(Number(formData.rent_payment_ratio)*100).toFixed(0)}%` : "—"}</strong></div>
                <div><span className="text-slate-400">Past Bounces:</span> <strong className="text-slate-700">{formData.bounce_count_6m !== "" && formData.bounce_count_6m != null ? formData.bounce_count_6m : "0"}</strong></div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                className="flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </button>
            ) : <div />}

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 ? !isStep1Valid : !isStep2Valid}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-white text-xs font-semibold shadow-sm transition-all ${
                  (currentStep === 1 ? isStep1Valid : isStep2Valid)
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
                    : "bg-slate-300 cursor-not-allowed opacity-60"
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            ) : (
              <button
                disabled={isSubmitting || !isFormValid}
                onClick={() => {
                  if (isFormValid) {
                    onSubmit(formData);
                  }
                }}
                className={`flex items-center space-x-2 px-7 py-3 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
                  isFormValid && !isSubmitting
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:opacity-95 shadow-blue-600/20 cursor-pointer"
                    : "bg-slate-300 cursor-not-allowed opacity-60 shadow-none"
                }`}
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
