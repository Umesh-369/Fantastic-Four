"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, RefreshCw, ChevronRight } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface ApplicantsViewProps {
  onSelectApplicant?: (applicant: any) => void;
}

export const ApplicantsView: React.FC<ApplicantsViewProps> = ({ onSelectApplicant }) => {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/applicants?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setApplicants(data.items || []);
        setTotal(data.total || (data.items ? data.items.length : 0));
      }
    } catch (e) {
      console.error("Failed to fetch applicants:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const filtered = applicants.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone_number?.includes(searchQuery);

    const matchesType =
      filterType === "all" || app.employment_type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Registered Applicants</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live applicant database managed by Application Service (Port 8001). Total: {total} records.
            </p>
          </div>
        </div>

        <button
          onClick={fetchApplicants}
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
            placeholder="Search by name, applicant ID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 font-medium self-stretch sm:self-auto"
        >
          <option value="all">All Employment Types</option>
          <option value="gig">Gig Worker</option>
          <option value="salaried">Salaried</option>
          <option value="self_employed">Self-Employed</option>
        </select>
      </div>

      {/* Applicants List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading applicants...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {applicants.length === 0
              ? "No applicants registered yet. Submit a new application to populate."
              : "No applicants match your search filters."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Applicant ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4">Monthly Income</th>
                  <th className="py-3 px-4">Loan Requested</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Registered Date</th>
                  {onSelectApplicant && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => (
                  <tr key={app.applicant_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{app.applicant_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{app.full_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                        {app.employment_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      ₹{Number(app.monthly_income || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      ₹{Number(app.requested_loan_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      +91 {app.phone_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}
                    </td>
                    {onSelectApplicant && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectApplicant(app)}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          <span>Use in form</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
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
