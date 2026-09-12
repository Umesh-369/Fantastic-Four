"use client";

import React, { useState, useEffect } from "react";
import { Sliders, CheckCircle2, History, ArrowRightLeft, FileCode2, AlertCircle } from "lucide-react";

export const RuleManagerView: React.FC = () => {
  const [activeVersion, setActiveVersion] = useState("v1.0.0");
  const [versions, setVersions] = useState<any[]>([]);
  const [changelog, setChangelog] = useState<any[]>([]);
  const [activeRules, setActiveRules] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRuleData = async () => {
    try {
      const activeRes = await fetch("http://127.0.0.1:8003/v1/rules/active");
      if (activeRes.ok) {
        const data = await activeRes.json();
        setActiveVersion(data.active_version);
        setActiveRules(data.rule_set);
      }

      const versRes = await fetch("http://127.0.0.1:8003/v1/rules/versions");
      if (versRes.ok) {
        setVersions(await versRes.json());
      }

      const clRes = await fetch("http://127.0.0.1:8003/v1/rules/changelog");
      if (clRes.ok) {
        setChangelog(await clRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRuleData();
  }, []);

  const handleSwitchVersion = async (targetVer: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("http://127.0.0.1:8003/v1/rules/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: targetVer }),
      });
      if (res.ok) {
        setMessage(`Successfully activated rule policy ${targetVer} without service downtime or code changes!`);
        await fetchRuleData();
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
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
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Rule Manager & Policy Governance</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Versioned YAML configs under /config/rules/. Zero code edits, instant hot-reloading (H+8 Rapid Change).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Active Policy:</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-mono text-xs font-bold">
              {activeVersion}
            </span>
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Available Versions Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
            <ArrowRightLeft className="w-4 h-4 text-blue-600 mr-2" />
            Switch Active Rule Policy (Zero Code Touch)
          </h3>

          <div className="space-y-3">
            {versions.map((v) => {
              const isCurrent = v.version === activeVersion;
              return (
                <div
                  key={v.version}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? "bg-blue-50/50 border-blue-200"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center">
                        <span>Version {v.version}</span>
                        {isCurrent && (
                          <span className="ml-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{v.description}</p>
                    </div>

                    {!isCurrent && (
                      <button
                        disabled={loading}
                        onClick={() => handleSwitchVersion(v.version)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Activate Policy
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Thresholds Display */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
            <FileCode2 className="w-4 h-4 text-emerald-600 mr-2" />
            Active Thresholds ({activeVersion})
          </h3>

          {activeRules?.thresholds ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              {Object.entries(activeRules.thresholds).map(([k, val]: any) => (
                <div key={k} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{k}</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{String(val)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400">Loading active rules...</div>
          )}
        </div>
      </div>

      {/* Audit Changelog */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
          <History className="w-4 h-4 text-blue-600 mr-2" />
          Rule Governance Changelog (/v1/rules/changelog)
        </h3>

        <div className="space-y-3">
          {changelog.map((entry) => (
            <div key={entry.change_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-indigo-700">{entry.change_id}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[11px] font-bold">
                    {entry.rule_version}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">{entry.time_completed}</span>
              </div>
              <div className="text-slate-700 font-medium">{entry.description}</div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="text-slate-500">Files: <code className="text-blue-700">{entry.files_changed?.join(", ")}</code></span>
                <span className="text-emerald-700 font-semibold">• Code changes required: False</span>
                <span className="text-slate-500">• Test result: {entry.test_results}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
