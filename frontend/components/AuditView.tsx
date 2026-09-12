"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Play, Key } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

export const AuditView: React.FC = () => {
  const [verification, setVerification] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [reproduceResult, setReproduceResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAuditData = async () => {
    try {
      const vRes = await fetch(`${getApiBaseUrl()}/v1/audit/verify`);
      if (vRes.ok) setVerification(await vRes.json());

      const rRes = await fetch(`${getApiBaseUrl()}/v1/audit/records?limit=25`);
      if (rRes.ok) {
        const data = await rRes.json();
        setRecords(data.items || []);
        if (data.items?.length > 0 && !selectedAuditId) {
          setSelectedAuditId(data.items[0].audit_id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const handleRunReproduce = async (auditId: string) => {
    setLoading(true);
    setReproduceResult(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/audit/${auditId}/reproduce`);
      if (res.ok) {
        setReproduceResult(await res.json());
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Cryptographic Audit Trail & Historical Replay</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hash-chained tamper-evident ledger (prev_hash + entry_hash). Every decision reproducible years later.
              </p>
            </div>
          </div>

          <button
            onClick={fetchAuditData}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verify Ledger</span>
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                verification?.is_valid ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {verification?.is_valid ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Ledger Cryptographic Integrity: {verification?.is_valid ? "VERIFIED (100% Tamper-Evident)" : "TAMPER DETECTED"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {verification?.message} ({verification?.total_records || 0} chained blocks evaluated)
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] font-mono text-slate-400">
            <div>Genesis: {verification?.genesis_hash?.slice(0, 10)}...</div>
            <div>Head: {verification?.head_hash?.slice(0, 10)}...</div>
          </div>
        </div>
      </div>

      {/* Reproduce Decision Demo Box */}
      <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/50 rounded-3xl p-6 border border-indigo-100">
        <h3 className="text-sm font-bold text-indigo-950 mb-2 flex items-center">
          <Play className="w-4 h-4 text-indigo-600 mr-2" />
          Test Decision Reproducibility (/v1/audit/{`{audit_id}`}/reproduce)
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Select an audit record to re-run the exact historical model version, rule set, and inputs to prove deterministic reproducibility.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={selectedAuditId || ""}
            onChange={(e) => setSelectedAuditId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono"
          >
            {records.map((r) => (
              <option key={r.audit_id} value={r.audit_id}>
                {r.audit_id} — {r.applicant_id} ({r.decision} @ {r.risk_score.toFixed(1)})
              </option>
            ))}
          </select>

          <button
            disabled={loading || !selectedAuditId}
            onClick={() => selectedAuditId && handleRunReproduce(selectedAuditId)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {loading ? "Re-running..." : "Replay Decision Engine"}
          </button>
        </div>

        {reproduceResult && (
          <div className="p-4 rounded-2xl bg-white border border-indigo-100 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-800">Reproducibility Status:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase text-[11px]">
                {reproduceResult.is_reproducible ? "100% MATCH" : "DIVERGENCE"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Original Audit Record</span>
                <div className="mt-1 space-y-0.5">
                  <div>Score: <strong>{reproduceResult.original?.risk_score}</strong></div>
                  <div>Decision: <strong>{reproduceResult.original?.decision}</strong></div>
                  <div>Model: {reproduceResult.original?.model_version}</div>
                  <div>Rules: {reproduceResult.original?.rule_version}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Live Reproduced Output</span>
                <div className="mt-1 space-y-0.5">
                  <div>Score: <strong>{reproduceResult.reproduced?.risk_score}</strong></div>
                  <div>Decision: <strong>{reproduceResult.reproduced?.decision}</strong></div>
                  <div>Model: {reproduceResult.reproduced?.model_version}</div>
                  <div>Rules: {reproduceResult.reproduced?.rule_version}</div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-emerald-700 font-medium pt-2 border-t">
              {reproduceResult.message} (Score delta: {reproduceResult.risk_score_diff})
            </div>
          </div>
        )}
      </div>

      {/* Chained Records Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
          <Key className="w-4 h-4 text-blue-600 mr-2" />
          Append-Only Chained Ledger Records
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Audit ID</th>
                <th className="py-3 px-3">Applicant</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-3">Decision</th>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3">Rules</th>
                <th className="py-3 px-3">Entry Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.audit_id} className="hover:bg-slate-50/60 font-medium text-slate-700">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.audit_id}</td>
                  <td className="py-3 px-3">{r.applicant_id}</td>
                  <td className="py-3 px-3 font-bold">{r.risk_score.toFixed(1)}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.decision === "APPROVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.decision === "REVIEW"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {r.decision}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">{r.model_version}</td>
                  <td className="py-3 px-3 font-mono">{r.rule_version}</td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-400">{r.entry_hash?.slice(0, 16)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
