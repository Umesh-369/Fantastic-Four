"use client";

import React, { useState, useEffect } from "react";
import { Clock, Search, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

export const DecisionHistoryView: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/audit/records?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.items || []);
        setTotal(data.total || (data.items ? data.items.length : 0));
      }
    } catch (e) {
      console.error("Failed to fetch decision records:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filtered = records.filter((rec) => {
    const matchesStatus =
      statusFilter === "all" || rec.decision === statusFilter;
    const matchesSearch =
      !searchQuery ||
      rec.applicant_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.audit_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Decision History & Audit Trail</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only immutable record of all underwriting evaluations. Total recorded: {total}.
            </p>
          </div>
        </div>

        <button
          onClick={fetchRecords}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by audit ID or applicant ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 font-medium self-stretch sm:self-auto"
        >
          <option value="all">All Outcomes</option>
          <option value="APPROVE">Approved</option>
          <option value="REVIEW">Under Review</option>
          <option value="REJECT">Rejected</option>
        </select>
      </div>

      {/* Decision Records Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading decision history...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {records.length === 0
              ? "No decision records recorded yet. Evaluate an application to log a decision."
              : "No decision records match your search filter."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Audit ID</th>
                  <th className="py-3 px-3">Applicant ID</th>
                  <th className="py-3 px-3">Risk Score</th>
                  <th className="py-3 px-3">Decision</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3">Rules</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Entry Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((rec) => (
                  <tr key={rec.audit_id} className="hover:bg-slate-50/70 transition-colors font-medium text-slate-700">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{rec.audit_id}</td>
                    <td className="py-3.5 px-3 font-mono">{rec.applicant_id}</td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {typeof rec.risk_score === "number" ? rec.risk_score.toFixed(1) : rec.risk_score}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rec.decision === "APPROVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : rec.decision === "REVIEW"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {rec.decision === "APPROVE" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {rec.decision === "REVIEW" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {rec.decision === "REJECT" && <XCircle className="w-3 h-3 mr-1" />}
                        {rec.decision}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-500">{rec.model_version}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-500">{rec.rule_version}</td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                      {rec.timestamp ? new Date(rec.timestamp).toLocaleString() : "—"}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[10px] text-slate-400">
                      {rec.entry_hash ? `${rec.entry_hash.slice(0, 14)}...` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
