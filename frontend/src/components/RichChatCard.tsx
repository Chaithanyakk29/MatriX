import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, DollarSign, Server, Shield, Activity } from 'lucide-react';
import { AgentFinalReport } from '../types';

interface RichChatCardProps {
  report: AgentFinalReport;
}

export const RichChatCard: React.FC<RichChatCardProps> = ({ report }) => {
  const isSuccess = report.execution.status === 'success';
  const isFailed = report.execution.status === 'failed';
  const isSkipped = report.execution.status === 'skipped';

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3 font-sans">
      {/* Top Banner Tagline */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wide">
            Operational Decision
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
            {report.runId}
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-xs">
          {report.verification.status === 'passed' ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          ) : report.verification.status === 'failed' ? (
            <span className="inline-flex items-center gap-1 text-red-700 font-semibold text-[11px] bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
              <XCircle className="w-3 h-3" /> Failed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-600 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              SLA Unaltered
            </span>
          )}
        </div>
      </div>

      {/* Clean 2x2 Structured Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
            Target Service
          </span>
          <span className="font-semibold text-xs text-slate-900 truncate block mt-0.5">
            {report.problem.service}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
            Action Taken
          </span>
          <span className="font-semibold text-xs text-blue-700 uppercase block mt-0.5">
            {report.decision.action === 'no_action'
              ? 'Hold State'
              : `${report.decision.from_instances} → ${report.decision.to_instances} Instances`}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
            Est. Net Savings
          </span>
          <span className="font-semibold text-xs text-emerald-700 block mt-0.5 font-mono">
            ${report.estimated_savings_per_hour.toFixed(2)}/hr
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
            Health Check
          </span>
          <span className="font-semibold text-xs text-slate-800 flex items-center gap-1 mt-0.5">
            {report.verification.status === 'passed' ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> SLA Intact
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Standby
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Summary Description Box */}
      <div className="p-2.5 rounded-lg bg-slate-50/80 border-l-2 border-l-blue-500 border border-slate-200/60">
        <p className="text-xs text-slate-700 leading-relaxed">
          {report.summary}
        </p>
      </div>

      {/* Safety Checks & Mode Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Safety Guard:</span>
          <span className="text-emerald-700 font-semibold">
            {report.safety.status === 'passed' ? '100% Passed' : 'Blocked by Safety Engine'}
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          {report.mode === 'mistral' ? 'Mistral AI API' : report.mode === 'ollama' ? 'Ollama Qwen' : 'Deterministic SRE'}
        </div>
      </div>
    </div>
  );
};
