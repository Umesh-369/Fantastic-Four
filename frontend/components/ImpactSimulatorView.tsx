"use client";

import React, { useState } from "react";
import { Activity, Sliders, CheckCircle2, AlertTriangle, XCircle, Play } from "lucide-react";

export const ImpactSimulatorView: React.FC = () => {
  const [riskScore, setRiskScore] = useState(42.5);
  const [monthlyIncome, setMonthlyIncome] = useState(35000);
  const [bounceCount, setBounceCount] = useState(0);
  const [fraudScore, setFraudScore] = useState(0.04);
  const [rentRatio, setRentRatio] = useState(0.92);
  const [ruleVersion, setRuleVersion] = useState("v1.0.0");
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const payload = {
        risk_score: riskScore,
        monthly_income: monthlyIncome,
        bounce_count_6m: bounceCount,
        fraud_risk_score: fraudScore,
        data_conflict_count: 0,
        rent_payment_ratio: rentRatio,
        income_to_expense_ratio: 1.5,
      };

      const res = await fetch(`http://127.0.0.1:8003/v1/rules/evaluate?version=${ruleVersion}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSimulationResult(await res.json());
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
              Simulate how risk thresholds and alternate data indicators influence underwriting decisions in real time.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <Sliders className="w-4 h-4 text-blue-600 mr-2" />
            Simulation Parameters
          </h3>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Risk Score (0 - 100)</span>
              <span className="font-mono text-blue-600 font-bold">{riskScore.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={riskScore}
              onChange={(e) => setRiskScore(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monthly Income (₹)
            </label>
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
            />
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
                value={bounceCount}
                onChange={(e) => setBounceCount(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
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
                onChange={(e) => setFraudScore(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
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
              <option value="v1.0.0">v1.0.0 (Standard Thresholds)</option>
              <option value="v1.1.0">v1.1.0 (Higher Rent Flexibility)</option>
            </select>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
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
                    Rule Evaluation Details
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>Policy: <strong className="font-mono">{simulationResult.rule_version}</strong></div>
                    <div>Confidence: <strong>{(simulationResult.confidence * 100).toFixed(0)}%</strong></div>
                  </div>
                </div>

                {simulationResult.rules_triggered?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Rules Triggered
                    </div>
                    <div className="space-y-1.5">
                      {simulationResult.rules_triggered.map((rule: string, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                          {rule}
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
