"use client";

import React, { useState, useEffect } from "react";
import { Activity, Sliders, CheckCircle2, AlertTriangle, XCircle, Play, Cpu, ShieldCheck, AlertCircle } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

export const ImpactSimulatorView: React.FC = () => {
  const [simulationMode, setSimulationMode] = useState<"auto" | "manual">("auto");
  const [riskScore, setRiskScore] = useState(42.5);
  const [monthlyIncome, setMonthlyIncome] = useState(35000);
  const [bounceCount, setBounceCount] = useState(0);
  const [fraudScore, setFraudScore] = useState(0.04);
  const [rentRatio, setRentRatio] = useState(0.92);
  const [ruleVersion, setRuleVersion] = useState("v1.0.0");
  const [availableVersions, setAvailableVersions] = useState<any[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [mlScoreResult, setMlScoreResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  const errors = {
    monthlyIncome: monthlyIncome <= 0 || monthlyIncome > 10000000 ? "Income must be between ₹1 and ₹1,00,00,000." : null,
    bounceCount: bounceCount < 0 || bounceCount > 50 || !Number.isInteger(bounceCount) ? "Bounces must be an integer between 0 and 50." : null,
    fraudScore: fraudScore < 0 || fraudScore > 1 ? "Fraud score must be between 0.00 and 1.00." : null,
    riskScore: riskScore < 0 || riskScore > 100 ? "Risk score must be between 0.0 and 100.0." : null,
  };
  const isInvalid = Boolean(errors.monthlyIncome || errors.bounceCount || errors.fraudScore || (simulationMode === "manual" && errors.riskScore));

  // Dynamically load rule versions from Rule Service
  useEffect(() => {
    const loadVersions = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/v1/rules/versions`);
        if (res.ok) {
          const vers = await res.json();
          if (Array.isArray(vers) && vers.length > 0) {
            setAvailableVersions(vers);
            const active = vers.find((v: any) => v.is_active);
            if (active) setRuleVersion(active.version);
          }
        }
      } catch (e) {
        console.error("Failed to load rule versions:", e);
      }
    };
    loadVersions();
  }, []);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      let scoreToEvaluate = riskScore;

      // 1. If in Auto Mode, derive real ML risk score via Credit Engine
      if (simulationMode === "auto") {
        const cePayload = {
          employment_type: "gig",
          rent_payment_ratio: rentRatio,
          utility_payment_ratio: 0.90,
          telecom_payment_ratio: 0.92,
          telecom_tenure_months: 36.0,
          monthly_bank_inflow: monthlyIncome,
          monthly_bank_outflow: monthlyIncome * 0.65,
          avg_bank_balance: monthlyIncome * 0.35,
          bounce_count_6m: bounceCount,
          gig_monthly_earnings: monthlyIncome * 0.75,
          gig_earnings_stability: 0.85,
          gig_months_active: 24.0,
          gig_rating: 4.6,
          income_to_expense_ratio: 1.54,
          payment_consistency: 0.91,
          data_conflict_count: 0,
          fraud_risk_score: fraudScore,
          missing_data_ratio: 0.0,
        };

        const ceRes = await fetch(`${getApiBaseUrl()}/v1/credit-engine/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cePayload),
        });

        if (ceRes.ok) {
          const ceData = await ceRes.json();
          scoreToEvaluate = ceData.risk_score;
          setRiskScore(ceData.risk_score);
          setMlScoreResult(ceData);
        }
      } else {
        setMlScoreResult(null);
      }

      // 2. Evaluate Rule Service
      const rulePayload = {
        risk_score: scoreToEvaluate,
        monthly_income: monthlyIncome,
        bounce_count_6m: bounceCount,
        fraud_risk_score: fraudScore,
        data_conflict_count: 0,
        rent_payment_ratio: rentRatio,
        income_to_expense_ratio: 1.5,
      };

      const res = await fetch(`${getApiBaseUrl()}/v1/rules/evaluate?version=${ruleVersion}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rulePayload),
      });

      if (res.ok) {
        const data = await res.json();
        data.evaluated_score = scoreToEvaluate;
        setSimulationResult(data);
      }
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Policy Impact & What-If Simulator</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate how ML risk scoring and externalized rule policies determine underwriting decisions in real time.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Sliders className="w-4 h-4 text-blue-600 mr-2" />
              Simulation Mode
            </h3>
            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSimulationMode("auto")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  simulationMode === "auto"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Model + Rules
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode("manual")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  simulationMode === "manual"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Manual Score
              </button>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            {simulationMode === "auto" ? (
              <span>
                <strong className="text-blue-600">Auto Mode (Model + Rules):</strong> Feature inputs below are processed by the real <strong>Credit Engine</strong> ML model to derive the risk score, which is then evaluated by the <strong>Rule Engine</strong>.
              </span>
            ) : (
              <span>
                <strong className="text-amber-600">Manual Override Mode:</strong> The Risk Score slider value is sent directly to the <strong>Rule Engine</strong> to test policy cutoffs independently of the ML model.
              </span>
            )}
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Risk Score (0 - 100) {simulationMode === "auto" && "(Derived by ML)"}</span>
              <span className="font-mono text-blue-600 font-bold">{riskScore.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={riskScore}
              disabled={simulationMode === "auto"}
              onChange={(e) => setRiskScore(parseFloat(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                simulationMode === "auto" ? "bg-slate-100 opacity-60" : "bg-slate-200"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monthly Income (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="10000000"
              value={monthlyIncome}
              onKeyDown={blockPositiveNumericKeys}
              onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
              className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                errors.monthlyIncome ? "border-rose-400 bg-rose-50/20 focus:border-rose-500" : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors.monthlyIncome && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                {errors.monthlyIncome}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Rent Payment Ratio (12m)</span>
              <span className="font-mono text-blue-600 font-bold">{(rentRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={rentRatio}
              onChange={(e) => setRentRatio(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Bounces (6m)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={bounceCount}
                onKeyDown={blockIntegerKeys}
                onChange={(e) => setBounceCount(parseInt(e.target.value) || 0)}
                className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                  errors.bounceCount ? "border-rose-400 bg-rose-50/20 focus:border-rose-500" : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errors.bounceCount && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                  {errors.bounceCount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fraud Score (0-1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={fraudScore}
                onKeyDown={blockPositiveNumericKeys}
                onChange={(e) => setFraudScore(parseFloat(e.target.value) || 0)}
                className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-slate-800 transition-colors focus:outline-hidden ${
                  errors.fraudScore ? "border-rose-400 bg-rose-50/20 focus:border-rose-500" : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errors.fraudScore && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center font-medium">
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                  {errors.fraudScore}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rule Policy Version
            </label>
            <select
              value={ruleVersion}
              onChange={(e) => setRuleVersion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 font-medium"
            >
              {availableVersions.length > 0 ? (
                availableVersions.map((v: any) => (
                  <option key={v.version} value={v.version}>
                    {v.version} {v.description ? `(${v.description})` : ""} {v.is_active ? "— Active" : ""}
                  </option>
                ))
              ) : (
                <>
                  <option value="v1.0.0">v1.0.0 (Standard Thresholds)</option>
                  <option value="v1.1.0">v1.1.0 (Higher Rent Flexibility)</option>
                </>
              )}
            </select>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading || isInvalid}
            className={`w-full mt-2 flex items-center justify-center space-x-2 py-3 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
              loading || isInvalid
                ? "bg-slate-300 cursor-not-allowed opacity-60 shadow-none"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 cursor-pointer"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? "Simulating..." : "Execute Simulation"}</span>
          </button>
        </div>

        {/* Right Output Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Simulated Underwriting Outcome
            </h3>

            {simulationResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Decision Outcome</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      simulationResult.decision === "APPROVE"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : simulationResult.decision === "REVIEW"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {simulationResult.decision === "APPROVE" && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                    {simulationResult.decision === "REVIEW" && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                    {simulationResult.decision === "REJECT" && <XCircle className="w-3.5 h-3.5 mr-1" />}
                    {simulationResult.decision}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
                    Evaluation Details
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>Policy: <strong className="font-mono">{simulationResult.rule_version}</strong></div>
                    <div>Evaluated Risk Score: <strong className="font-mono text-blue-600">{Number(simulationResult.evaluated_score ?? riskScore).toFixed(1)}</strong></div>
                    {mlScoreResult && (
                      <>
                        <div>ML Model: <strong className="font-mono">{mlScoreResult.model_version}</strong></div>
                        <div>Features Used: <strong>{mlScoreResult.features_used}</strong></div>
                      </>
                    )}
                  </div>
                </div>

                {simulationResult.reasons?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Decision Drivers & Rule Triggers
                    </div>
                    <div className="space-y-1.5">
                      {simulationResult.reasons.map((reason: string, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Adjust parameters on the left and click &quot;Execute Simulation&quot; to test.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
