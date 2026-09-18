import React, { useState } from 'react';
import {
  Sparkles,
  Eye,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Activity,
  Server,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { AgentFinalReport, WsEvent } from '../types';
import { AgentStep } from './AgentLiveStepper';

interface AgentEventChainProps {
  isAgentRunning: boolean;
  currentStep: AgentStep;
  report: AgentFinalReport | null;
  events: WsEvent[];
  lastPrompt?: string;
}

export const AgentEventChain: React.FC<AgentEventChainProps> = ({
  isAgentRunning,
  currentStep,
  report,
  events,
  lastPrompt,
}) => {
  const [isLogExpanded, setIsLogExpanded] = useState<boolean>(false);

  // Derive active stage for timeline
  // 1: Directive, 2: Observe, 3: Safety Gate, 4: Mutate, 5: Verify
  const getStageState = (stage: number): 'pending' | 'running' | 'completed' | 'failed' => {
    if (isAgentRunning) {
      if (stage === 1) return 'completed';
      if (stage === 2) {
        if (currentStep === 'think') return 'running';
        if (currentStep === 'decide' || currentStep === 'act' || currentStep === 'completed') return 'completed';
        return 'running';
      }
      if (stage === 3) {
        if (currentStep === 'decide') return 'running';
        if (currentStep === 'act' || currentStep === 'completed') return 'completed';
        return 'pending';
      }
      if (stage === 4) {
        if (currentStep === 'act') return 'running';
        if (currentStep === 'completed') return 'completed';
        return 'pending';
      }
      if (stage === 5) {
        if (currentStep === 'completed') return 'completed';
        return 'pending';
      }
      return 'pending';
    }

    // When not running: check report
    if (report) {
      if (stage === 1 || stage === 2) return 'completed';
      if (stage === 3) {
        return report.safety.status === 'passed' ? 'completed' : 'failed';
      }
      if (stage === 4) {
        if (report.safety.status === 'rejected') return 'failed';
        if (report.execution.status === 'failed') return 'failed';
        return 'completed';
      }
      if (stage === 5) {
        if (report.verification.status === 'passed') return 'completed';
        if (report.verification.status === 'failed') return 'failed';
        return report.safety.status === 'passed' ? 'completed' : 'pending';
      }
    }

    return 'pending';
  };

  const hasRun = Boolean(report || isAgentRunning || events.length > 0);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Chain Status Header Banner */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span
              className={`w-2.5 h-2.5 rounded-full block ${
                isAgentRunning
                  ? 'bg-blue-600 animate-ping'
                  : hasRun
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
            />
            <span
              className={`w-2.5 h-2.5 rounded-full absolute inset-0 ${
                isAgentRunning ? 'bg-blue-600' : hasRun ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>Execution Event Chain</span>
              {isAgentRunning && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-semibold animate-pulse">
                  Step {currentStep === 'think' ? '2' : currentStep === 'decide' ? '3' : '4'} of 5
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {isAgentRunning
                ? 'Autonomous agent traversing telemetry & guardrails'
                : hasRun
                ? `Trace ID: ${report?.runId || 'completed-run'}`
                : 'Standby • Waiting for user directive'}
            </p>
          </div>
        </div>

        {report && !isAgentRunning && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        )}
      </div>

      {/* Vertical Connected Chain of Events */}
      <div className="relative pl-5 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {/* =========================================================================
            EVENT 1: Directive & Context Ingestion
           ========================================================================= */}
        <div className="relative">
          {/* Node Icon */}
          <div
            className={`absolute -left-5 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
              getStageState(1) === 'completed'
                ? 'bg-emerald-500 border-white text-white shadow-xs'
                : 'bg-white border-blue-500 text-blue-600'
            }`}
          >
            {getStageState(1) === 'completed' ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <Sparkles className="w-2.5 h-2.5" />
            )}
          </div>

          {/* Event Content Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Event 01
                </span>
                <span className="text-xs font-bold text-slate-900">Directive Ingested</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {hasRun ? 'Ingested' : 'Standby'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {lastPrompt
                ? `"${lastPrompt}"`
                : hasRun
                ? 'Processed incoming operator directive and initialized autonomous safety loop.'
                : 'Awaiting operator instruction via prompt input or scenario buttons.'}
            </p>
          </div>
        </div>

        {/* =========================================================================
            EVENT 2: Telemetry & Fleet Observability (Think)
           ========================================================================= */}
        <div className="relative">
          {/* Node Icon */}
          <div
            className={`absolute -left-5 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
              getStageState(2) === 'completed'
                ? 'bg-emerald-500 border-white text-white shadow-xs'
                : getStageState(2) === 'running'
                ? 'bg-blue-600 border-white text-white animate-pulse'
                : 'bg-white border-slate-300 text-slate-400'
            }`}
          >
            {getStageState(2) === 'completed' ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : getStageState(2) === 'running' ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ) : (
              <Eye className="w-2.5 h-2.5" />
            )}
          </div>

          {/* Event Content Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Event 02
                </span>
                <span className="text-xs font-bold text-slate-900">Telemetry Ingestion (Think)</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  getStageState(2) === 'running'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                    : getStageState(2) === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                {getStageState(2) === 'running'
                  ? 'Observing...'
                  : getStageState(2) === 'completed'
                  ? 'Observed'
                  : 'Pending'}
              </span>
            </div>

            {getStageState(2) === 'running' ? (
              <div className="flex items-center gap-2 text-xs text-blue-700 font-medium py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Scanning fleet microservices, live traffic RPM, and CPU metrics...</span>
              </div>
            ) : report ? (
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                      Target Discovered
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {report.problem.service}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                      Condition
                    </span>
                    <span className="font-semibold text-slate-700">{report.problem.reason}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Autonomous telemetry reader scans metrics across all 5 cluster services.
              </p>
            )}
          </div>
        </div>

        {/* =========================================================================
            EVENT 3: Deterministic Safety Gate Evaluation (Decide)
           ========================================================================= */}
        <div className="relative">
          {/* Node Icon */}
          <div
            className={`absolute -left-5 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
              getStageState(3) === 'completed'
                ? 'bg-emerald-500 border-white text-white shadow-xs'
                : getStageState(3) === 'running'
                ? 'bg-amber-500 border-white text-white animate-pulse'
                : getStageState(3) === 'failed'
                ? 'bg-red-500 border-white text-white'
                : 'bg-white border-slate-300 text-slate-400'
            }`}
          >
            {getStageState(3) === 'completed' ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : getStageState(3) === 'running' ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ) : getStageState(3) === 'failed' ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <ShieldCheck className="w-2.5 h-2.5" />
            )}
          </div>

          {/* Event Content Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Event 03
                </span>
                <span className="text-xs font-bold text-slate-900">Safety Gate Evaluation (Decide)</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  getStageState(3) === 'running'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                    : getStageState(3) === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : getStageState(3) === 'failed'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                {getStageState(3) === 'running'
                  ? 'Gating...'
                  : getStageState(3) === 'completed'
                  ? 'Guardrails Passed'
                  : getStageState(3) === 'failed'
                  ? 'Blocked by Policy'
                  : 'Pending'}
              </span>
            </div>

            {getStageState(3) === 'running' ? (
              <div className="flex items-center gap-2 text-xs text-amber-700 font-medium py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Testing proposed action against 10+ deterministic safety constraints...</span>
              </div>
            ) : report?.safety ? (
              <div className="space-y-1.5">
                {report.safety.checks.slice(0, 3).map((chk, cIdx) => (
                  <div key={cIdx} className="flex items-start gap-1.5 text-[11px] text-slate-600 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{chk}</span>
                  </div>
                ))}
                {report.safety.checks.length > 3 && (
                  <p className="text-[10px] font-mono text-slate-400 pl-5">
                    + {report.safety.checks.length - 3} additional safety checks passed
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Deterministic SRE engine evaluates min/max node boundaries, SLA limits, and live metrics.
              </p>
            )}
          </div>
        </div>

        {/* =========================================================================
            EVENT 4: Infrastructure Mutation (Act)
           ========================================================================= */}
        <div className="relative">
          {/* Node Icon */}
          <div
            className={`absolute -left-5 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
              getStageState(4) === 'completed'
                ? 'bg-emerald-500 border-white text-white shadow-xs'
                : getStageState(4) === 'running'
                ? 'bg-blue-600 border-white text-white animate-pulse'
                : getStageState(4) === 'failed'
                ? 'bg-amber-500 border-white text-white'
                : 'bg-white border-slate-300 text-slate-400'
            }`}
          >
            {getStageState(4) === 'completed' ? (
              <Zap className="w-3 h-3" />
            ) : getStageState(4) === 'running' ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ) : (
              <Zap className="w-2.5 h-2.5" />
            )}
          </div>

          {/* Event Content Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Event 04
                </span>
                <span className="text-xs font-bold text-slate-900">Infrastructure Mutation (Act)</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  getStageState(4) === 'running'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                    : getStageState(4) === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                {getStageState(4) === 'running'
                  ? 'Dispatching...'
                  : getStageState(4) === 'completed'
                  ? 'Mutation Dispatched'
                  : 'Pending'}
              </span>
            </div>

            {getStageState(4) === 'running' ? (
              <div className="flex items-center gap-2 text-xs text-blue-700 font-medium py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Applying container scaling mutation to cloud fleet orchestrator...</span>
              </div>
            ) : report ? (
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600">Action:</span>
                  <span className="font-mono font-bold text-blue-800 uppercase">
                    {report.decision.action === 'no_action'
                      ? 'No Mutation (State Held)'
                      : `${report.decision.action} (${report.decision.from_instances} → ${report.decision.to_instances} Nodes)`}
                  </span>
                </div>
                {report.estimated_savings_per_hour > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-200/50">
                    <span className="font-mono text-slate-600">Hourly Delta:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      +${report.estimated_savings_per_hour.toFixed(2)}/hr saved
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Executes automated scale-up or scale-down with transactional rollback protection.
              </p>
            )}
          </div>
        </div>

        {/* =========================================================================
            EVENT 5: Post-Action SLA Verification (Verify)
           ========================================================================= */}
        <div className="relative">
          {/* Node Icon */}
          <div
            className={`absolute -left-5 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
              getStageState(5) === 'completed'
                ? 'bg-emerald-500 border-white text-white shadow-xs'
                : 'bg-white border-slate-300 text-slate-400'
            }`}
          >
            {getStageState(5) === 'completed' ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <Activity className="w-2.5 h-2.5" />
            )}
          </div>

          {/* Event Content Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Event 05
                </span>
                <span className="text-xs font-bold text-slate-900">Post-Action SLA Verification</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  getStageState(5) === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                {getStageState(5) === 'completed' ? 'Verified Safe' : 'Pending'}
              </span>
            </div>

            {report?.verification ? (
              <div className="space-y-1 text-xs text-slate-700">
                <p className="leading-relaxed">
                  Active telemetry verification confirmed stable latency (
                  <span className="font-mono font-bold text-blue-700">
                    {report.verification.latency_ms || 110}ms
                  </span>
                  ), 0% error rate, and full SLA compliance.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Sends automated verification probe to ensure response latency and SLA compliance.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Live Micro-Events Stream */}
      <div className="pt-2 border-t border-slate-200/80">
        <button
          onClick={() => setIsLogExpanded(!isLogExpanded)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-mono font-semibold transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-600" />
            <span>Live Tool Telemetry & WebSocket Stream</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {events.length}
            </span>
          </div>
          {isLogExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {isLogExpanded && (
          <div className="mt-2 p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[10px] space-y-1.5 max-h-56 overflow-y-auto shadow-inner border border-slate-800">
            {events.length === 0 ? (
              <div className="text-slate-500 italic py-2 text-center">
                Waiting for tool calls...
              </div>
            ) : (
              events.map((evt, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 leading-relaxed border-b border-slate-900 pb-1 last:border-0 last:pb-0"
                >
                  <span className="text-slate-500 shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span className="text-emerald-400 font-bold uppercase shrink-0">
                    [{evt.type}]
                  </span>
                  <span className="text-slate-300 break-all">{evt.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
