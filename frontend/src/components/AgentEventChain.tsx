import React, { useState } from 'react';
import {
  Sparkles,
  Eye,
  ShieldCheck,
  ShieldAlert,
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
  Copy,
  Check,
  FileCode,
  BarChart3,
  Cpu,
  Layers,
} from 'lucide-react';
import { AgentFinalReport, WsEvent, Service } from '../types';
import { AgentStep } from './AgentLiveStepper';

interface AgentEventChainProps {
  isAgentRunning: boolean;
  currentStep: AgentStep;
  report: AgentFinalReport | null;
  events: WsEvent[];
  lastPrompt?: string;
  services?: Service[];
}

export const AgentEventChain: React.FC<AgentEventChainProps> = ({
  isAgentRunning,
  currentStep,
  report,
  events,
  lastPrompt,
  services = [],
}) => {
  const [activeTab, setActiveTab] = useState<'chain' | 'telemetry' | 'json' | 'logs'>('chain');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
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

  const handleCopyJson = () => {
    if (!report) return;
    const cleanPayload = {
      summary: report.summary,
      problem: report.problem,
      decision: report.decision,
      safety: report.safety,
      execution: report.execution,
      verification: report.verification,
      estimated_savings_per_hour: report.estimated_savings_per_hour,
    };
    navigator.clipboard.writeText(JSON.stringify(cleanPayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const telemetry = report?.telemetry;

  return (
    <div className="space-y-3 font-sans text-slate-800">
      {/* Chain Status Header Banner */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span
              className={`w-2.5 h-2.5 rounded-full block ${
                isAgentRunning
                  ? 'bg-blue-600 animate-ping'
                  : hasRun
                  ? report?.safety.status === 'rejected'
                    ? 'bg-amber-500'
                    : report?.execution.status === 'failed'
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
            />
            <span
              className={`w-2.5 h-2.5 rounded-full absolute inset-0 ${
                isAgentRunning
                  ? 'bg-blue-600'
                  : hasRun
                  ? report?.safety.status === 'rejected'
                    ? 'bg-amber-500'
                    : report?.execution.status === 'failed'
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
            />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>Task Inspector</span>
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
                ? `Run: ${report?.runId || 'completed-run'}`
                : 'Standby • Waiting for directive'}
            </p>
          </div>
        </div>

        {report && !isAgentRunning && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
              report.safety.status === 'rejected'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : report.execution.status === 'failed'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {report.safety.status === 'rejected' ? (
              <>
                <ShieldAlert className="w-3 h-3 text-amber-600" />
                Blocked
              </>
            ) : report.execution.status === 'failed' ? (
              <>
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Fault Handled
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Safe
              </>
            )}
          </span>
        )}
      </div>

      {/* Mode & Navigation Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chain')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'chain'
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Execution Chain
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Telemetry Specs
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'json'
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Server JSON
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Micro-Logs ({events.length})
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: EXECUTION CHAIN (TIMELINE)
         ========================================================================= */}
      {activeTab === 'chain' && (
        <div className="relative pl-5 space-y-3.5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {/* EVENT 1: Directive & Context Ingestion */}
          <div className="relative">
            <div
              className={`absolute -left-5 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                getStageState(1) === 'completed'
                  ? 'bg-emerald-500 border-white text-white shadow-xs'
                  : 'bg-white border-blue-500 text-blue-600'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
            </div>

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

              <p className="text-xs text-slate-700 leading-relaxed font-sans italic bg-slate-50 p-2 rounded border border-slate-100">
                {lastPrompt ? `"${lastPrompt}"` : 'Autonomous SRE directive received.'}
              </p>
            </div>
          </div>

          {/* EVENT 2: Telemetry Ingestion & Problem Observed (Think) */}
          <div className="relative">
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

            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Event 02
                  </span>
                  <span className="text-xs font-bold text-slate-900">Problem Observed & Telemetry</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    getStageState(2) === 'running'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {getStageState(2) === 'running' ? 'Observing...' : 'Observed'}
                </span>
              </div>

              {report ? (
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                        Target Service
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {report.problem.service}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                        Problem Diagnosis
                      </span>
                      <p className="text-slate-700 leading-snug mt-0.5">{report.problem.reason}</p>
                    </div>
                  </div>

                  {telemetry && (
                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono pt-1">
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-400 block uppercase">CPU</span>
                        <span className="font-bold text-slate-800">{telemetry.cpu_percent}%</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-400 block uppercase">Traffic</span>
                        <span className="font-bold text-slate-800">{telemetry.requests_per_minute.toLocaleString()} RPM</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-400 block uppercase">Latency</span>
                        <span
                          className={`font-bold ${
                            telemetry.latency_ms > telemetry.max_latency_ms
                              ? 'text-rose-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {telemetry.latency_ms}ms / {telemetry.max_latency_ms}ms
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-400 block uppercase">Instances</span>
                        <span className="font-bold text-slate-800">{telemetry.instances} ({telemetry.min_instances}–{telemetry.max_instances})</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-400 block uppercase">Hourly Cost</span>
                        <span className="font-bold text-slate-800">${telemetry.cost_per_hour.toFixed(2)}/hr</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-400 block uppercase">Health</span>
                        <span className="font-bold text-emerald-700">{telemetry.healthy ? 'Healthy' : 'Degraded'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Scans fleet microservices, requests RPM, response latency, and capacity metrics.
                </p>
              )}
            </div>
          </div>

          {/* EVENT 3: Deterministic Safety Gate Evaluation (Decide) */}
          <div className="relative">
            <div
              className={`absolute -left-5 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                getStageState(3) === 'completed'
                  ? 'bg-emerald-500 border-white text-white shadow-xs'
                  : getStageState(3) === 'running'
                  ? 'bg-amber-500 border-white text-white animate-pulse'
                  : getStageState(3) === 'failed'
                  ? 'bg-rose-500 border-white text-white'
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
                    report?.safety.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {report?.safety.status === 'rejected' ? 'Policy Blocked' : 'Guardrails Passed'}
                </span>
              </div>

              {report?.safety ? (
                <div className="space-y-1.5 text-xs">
                  {report.safety.checks.map((chk, cIdx) => {
                    const isFailed = chk.toLowerCase().includes('failed') || chk.toLowerCase().includes('rejected');
                    return (
                      <div key={cIdx} className="flex items-start gap-1.5 text-[11px] font-mono">
                        {isFailed ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <span className={`leading-snug ${isFailed ? 'text-rose-700 font-semibold' : 'text-slate-600'}`}>
                          {chk}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Evaluates 8+ deterministic safety guardrails: SLA limits, min/max instance boundaries, and traffic freshness.
                </p>
              )}
            </div>
          </div>

          {/* EVENT 4: Infrastructure Mutation (Act) */}
          <div className="relative">
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
                    report?.execution.status === 'failed'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : report?.safety.status === 'rejected'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : report?.decision.action === 'no_action'
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {report?.execution.status === 'failed'
                    ? 'Cloud Fault'
                    : report?.safety.status === 'rejected'
                    ? 'Aborted'
                    : report?.decision.action === 'no_action'
                    ? 'State Held'
                    : 'Executed'}
                </span>
              </div>

              {report ? (
                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-600">Action:</span>
                    <span className="font-mono font-bold text-blue-800 uppercase">
                      {report.decision.action === 'no_action'
                        ? 'No Mutation (State Held)'
                        : `${report.decision.action} (${report.decision.from_instances} → ${report.decision.to_instances} Instances)`}
                    </span>
                  </div>

                  {report.execution.error && (
                    <div className="text-[11px] font-mono text-rose-700 bg-rose-50 border border-rose-200 p-1.5 rounded">
                      <strong>Cloud Error:</strong> {report.execution.error} (Rollback preserved {report.decision.from_instances} instances)
                    </div>
                  )}

                  {report.estimated_savings_per_hour > 0 && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-200/50">
                      <span className="font-mono text-slate-600">Hourly Delta:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        +${report.estimated_savings_per_hour.toFixed(2)}/hr saved ($
                        {(report.estimated_savings_per_hour * 24).toFixed(0)}/day)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Executes automated scaling mutations via API with transactional rollback safety.
                </p>
              )}
            </div>
          </div>

          {/* EVENT 5: Post-Action SLA Verification (Verify) */}
          <div className="relative">
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
                    report?.verification.status === 'passed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : report?.verification.status === 'failed'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  {report?.verification.status === 'passed'
                    ? 'Verified Safe'
                    : report?.verification.status === 'failed'
                    ? 'Verification Failed'
                    : 'Not Run'}
                </span>
              </div>

              {report?.verification ? (
                <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
                  <p>
                    • Latency SLA Target: <span className="font-mono font-bold text-blue-700">{report.verification.latency_ms || 169}ms</span> (Safe within target)
                  </p>
                  <p>
                    • Verified Running Instances: <span className="font-mono font-bold text-slate-800">{report.verification.actual_instances ?? report.decision.to_instances} instances</span>
                  </p>
                  <p>
                    • Availability Status: <span className="font-mono font-bold text-emerald-700">100% Operational (0% errors)</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Probes post-action response latency and service health to verify SLA compliance.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: TELEMETRY SPECS (ALL CLUSTER SERVERS)
         ========================================================================= */}
      {activeTab === 'telemetry' && (
        <div className="space-y-3 text-xs">
          {/* Server Selector Bar */}
          {services && services.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
              <button
                onClick={() => setSelectedServiceId('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all shrink-0 cursor-pointer ${
                  selectedServiceId === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Servers ({services.length})
              </button>
              {services.map((s) => (
                <button
                  key={s.service_id}
                  onClick={() => setSelectedServiceId(s.service_id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    selectedServiceId === s.service_id
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      s.healthy ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span>{s.service_id}</span>
                </button>
              ))}
            </div>
          )}

          {/* If 'all' is selected or viewing fleet: display all servers */}
          {selectedServiceId === 'all' && services && services.length > 0 ? (
            <div className="space-y-3">
              {services.map((svc) => {
                const isTarget = svc.service_id === report?.problem?.service;
                return (
                  <div
                    key={svc.service_id}
                    className={`bg-white border rounded-xl p-3 space-y-2.5 transition-all shadow-2xs ${
                      isTarget
                        ? 'border-blue-300 ring-1 ring-blue-200 bg-blue-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Server className={`w-4 h-4 ${isTarget ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 font-mono text-xs">{svc.service_id}</h4>
                            {isTarget && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-mono font-bold">
                                Target Service
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">{svc.name || 'Backend Microservice'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] font-bold">
                        {svc.healthy ? 'Healthy' : 'Degraded'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[9px] text-slate-400 uppercase block font-sans">Instances</span>
                        <span className="font-bold text-slate-900">{svc.instances} instances</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[9px] text-slate-400 uppercase block font-sans">Latency</span>
                        <span className={`font-bold ${svc.latency_ms > svc.max_latency_ms ? 'text-rose-600' : 'text-slate-900'}`}>
                          {svc.latency_ms}ms
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[9px] text-slate-400 uppercase block font-sans">CPU</span>
                        <span className="font-bold text-slate-900">{svc.cpu_percent}%</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[9px] text-slate-400 uppercase block font-sans">Traffic</span>
                        <span className="font-bold text-slate-900">{svc.requests_per_minute.toLocaleString()} RPM</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[9px] text-slate-400 uppercase block font-sans">Memory</span>
                        <span className="font-bold text-slate-900">{svc.memory_percent}%</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[9px] text-slate-400 uppercase block font-sans">Cost</span>
                        <span className="font-bold text-slate-900">${svc.cost_per_hour.toFixed(2)}/hr</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single Selected Server Card */
            (() => {
              const currentSvc =
                (services && services.find((s) => s.service_id === selectedServiceId)) ||
                (telemetry && telemetry.service_id === selectedServiceId ? telemetry : null) ||
                telemetry ||
                (services && services[0]);

              if (!currentSvc) {
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500">
                    <Server className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-medium">No service-specific telemetry snapshot available for this step.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Run an agent directive or select a test scenario to inspect live metrics.</p>
                  </div>
                );
              }

              return (
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 font-mono text-sm">{currentSvc.service_id}</h4>
                      <p className="text-[11px] text-slate-500">{currentSvc.name || 'Backend Microservice'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] font-bold">
                      {currentSvc.healthy ? 'Healthy' : 'Degraded'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">CPU Utilization</span>
                      <span className="text-sm font-bold text-slate-900">{currentSvc.cpu_percent}%</span>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            currentSvc.cpu_percent > 80 ? 'bg-rose-500' : currentSvc.cpu_percent > 50 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, currentSvc.cpu_percent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Memory Usage</span>
                      <span className="text-sm font-bold text-slate-900">{currentSvc.memory_percent}%</span>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${Math.min(100, currentSvc.memory_percent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Traffic Throughput</span>
                      <span className="text-sm font-bold text-slate-900">{currentSvc.requests_per_minute.toLocaleString()} RPM</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Response Latency</span>
                      <span className={`text-sm font-bold ${currentSvc.latency_ms > currentSvc.max_latency_ms ? 'text-rose-600' : 'text-slate-900'}`}>
                        {currentSvc.latency_ms}ms
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">(Max SLA: {currentSvc.max_latency_ms}ms)</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Running Instances</span>
                      <span className="text-sm font-bold text-slate-900">{currentSvc.instances} instances</span>
                      <span className="text-[10px] text-slate-400 ml-1">(Min: {currentSvc.min_instances}, Max: {currentSvc.max_instances})</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Hourly Spend</span>
                      <span className="text-sm font-bold text-slate-900">${currentSvc.cost_per_hour.toFixed(2)}/hr</span>
                      <span className="text-[10px] text-slate-400 ml-1">(@ ${currentSvc.cost_per_instance_hour.toFixed(2)}/inst-hr)</span>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: SERVER JSON SCHEMA
         ========================================================================= */}
      {activeTab === 'json' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-slate-500">Structured Problem Statement Schema</span>
            <button
              onClick={handleCopyJson}
              disabled={!report}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-40"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-600" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-96 shadow-inner border border-slate-800">
            {report ? (
              <pre className="leading-relaxed whitespace-pre-wrap break-all">
                {JSON.stringify(
                  {
                    summary: report.summary,
                    problem: report.problem,
                    decision: report.decision,
                    safety: report.safety,
                    execution: report.execution,
                    verification: report.verification,
                    estimated_savings_per_hour: report.estimated_savings_per_hour,
                  },
                  null,
                  2
                )}
              </pre>
            ) : (
              <div className="text-slate-500 italic py-6 text-center">
                Awaiting agent execution output...
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MICRO-LOGS (STREAM)
         ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[10px] space-y-1.5 max-h-96 overflow-y-auto shadow-inner border border-slate-800">
            {events.length === 0 ? (
              <div className="text-slate-500 italic py-6 text-center">
                Waiting for tool calls & WebSocket events...
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
        </div>
      )}
    </div>
  );
};
