import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  RotateCw,
  Clock,
  Sliders,
} from 'lucide-react';
import { AgentFinalReport, WsEvent } from '../types';

interface AgentPageProps {
  onRunAgent: (prompt: string) => Promise<void>;
  isAgentRunning: boolean;
  agentReport: AgentFinalReport | null;
  events: WsEvent[];
  onClearEvents: () => void;
  onLoadScenarioAndRun?: (scenarioId: string, prompt: string) => Promise<void>;
}

export const AgentPage: React.FC<AgentPageProps> = ({
  onRunAgent,
  isAgentRunning,
  agentReport,
  events,
  onClearEvents,
  onLoadScenarioAndRun,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const benchmarkPresets = [
    {
      scenarioId: 'testA',
      title: 'Cost Optimization (Test A)',
      prompt:
        'Review the current services and reduce unnecessary cost without breaking the latency or availability requirements.',
      desc: 'reports-worker is idle (0 RPM, 4 nodes). Propose safe scale-down 4 → 1.',
    },
    {
      scenarioId: 'testB',
      title: 'Traffic Surge (Test B)',
      prompt: 'Orders traffic is increasing. Keep the service within its latency target.',
      desc: 'orders-api workload doubled to 4,200 RPM. Scale up 4 → 5 nodes to safeguard SLA.',
    },
    {
      scenarioId: 'testC',
      title: 'Stale Telemetry Guard (Test C)',
      prompt: 'Reduce cost if it is safe.',
      desc: 'checkout-api recorded 900 RPM stale vs 5,200 RPM live. Safety Engine blocks downscaling.',
    },
    {
      scenarioId: 'testD',
      title: 'Capacity Failure (Test D)',
      prompt: 'Scale the payment service only if the current state requires it.',
      desc: 'payment-api is overloaded. Scale-up triggers capacity_unavailable simulation error.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isAgentRunning) return;
    onRunAgent(inputPrompt.trim());
  };

  const handleSelectPreset = async (preset: (typeof benchmarkPresets)[0]) => {
    setInputPrompt(preset.prompt);
    if (onLoadScenarioAndRun) {
      await onLoadScenarioAndRun(preset.scenarioId, preset.prompt);
    } else {
      await onRunAgent(preset.prompt);
    }
  };

  return (
    <div className="space-y-6">
      {/* Benchmark Presets */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Standard Benchmarks
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {benchmarkPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              disabled={isAgentRunning}
              className="p-3 bg-white border border-slate-200 rounded-md text-left hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs transition-all disabled:opacity-50 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  <span>{preset.title}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {preset.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Operations Directive Form */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
            Optimization Directive
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Describe what you want CloudGuard to investigate across the infrastructure fleet.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="e.g. Review the current services and reduce unnecessary cost without breaking latency..."
            disabled={isAgentRunning}
            className="flex-1 px-3 py-2 text-xs rounded-md bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 shadow-2xs font-mono"
          />
          <button
            type="submit"
            disabled={isAgentRunning || !inputPrompt.trim()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors shadow-xs flex items-center justify-center gap-2 shrink-0"
          >
            {isAgentRunning ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Investigating Fleet...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>Run Investigation</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Main Operations Split: Timeline vs Engineering Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Investigation Activity Timeline (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Investigation Timeline
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {isAgentRunning && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" title="Running" />
              )}
              <button
                onClick={onClearEvents}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-mono"
              >
                Clear Log
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
            {events.length === 0 ? (
              <div className="text-center py-24 text-slate-400">
                <Clock className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p className="text-[11px]">No active investigation events.</p>
                <p className="text-[10px] text-slate-400 mt-1">Run an investigation to stream real-time telemetry.</p>
              </div>
            ) : (
              <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {events.map((evt, idx) => {
                  const isSuccess = evt.type.includes('passed') || evt.type.includes('succeeded');
                  const isFailed = evt.type.includes('failed') || evt.type.includes('error');
                  const isDecision = evt.type.includes('decision');

                  return (
                    <div key={idx} className="relative group text-[11px] space-y-1">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${
                          isSuccess
                            ? 'bg-emerald-500'
                            : isFailed
                            ? 'bg-red-500'
                            : isDecision
                            ? 'bg-blue-600'
                            : 'bg-slate-400'
                        }`}
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span className="text-slate-700 uppercase">
                          {String(idx + 1).padStart(2, '0')} {evt.type.replace(/_/g, ' ')}
                        </span>
                        <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>

                      <p className="text-slate-800 font-sans text-xs leading-relaxed">{evt.message}</p>
                    </div>
                  );
                })}
                <div ref={eventsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Structured Engineering Verdict (7 Cols) */}
        <div className="lg:col-span-7">
          {!agentReport ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center h-[600px] flex flex-col items-center justify-center shadow-2xs">
              <Terminal className="w-8 h-8 text-slate-300 mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">No Active Decision Record</h3>
              <p className="text-slate-500 text-xs max-w-sm mt-1">
                Trigger an investigation from the benchmarks above to view the root-cause analysis, Safety Engine verification, and SLA impact.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5 shadow-2xs overflow-y-auto max-h-[600px]">
              {/* Verdict Header */}
              <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                      Run {agentReport.runId}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {agentReport.mode === 'ollama' ? 'Ollama Qwen' : 'Deterministic Rule Engine'}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 mt-1">{agentReport.summary}</h2>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-500 block">Estimated Savings</span>
                  <span className="text-xl font-bold font-mono text-emerald-600">
                    +${agentReport.estimated_savings_per_hour.toFixed(2)}
                    <span className="text-xs text-slate-500 font-normal">/hr</span>
                  </span>
                </div>
              </div>

              {/* Decision Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-md border border-slate-100 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Targeted Service
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {agentReport.problem.service}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">{agentReport.problem.reason}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-md border border-slate-100 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Action Proposal
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                      {agentReport.decision.action.replace(/_/g, ' ')}
                    </span>
                    {agentReport.decision.action !== 'no_action' && (
                      <span className="text-xs font-mono text-slate-700">
                        {agentReport.decision.from_instances} →{' '}
                        <span className="text-emerald-600 font-bold">
                          {agentReport.decision.to_instances} nodes
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Target instance count: {agentReport.decision.to_instances}
                  </p>
                </div>
              </div>

              {/* Safety Engine Checklist */}
              <div className="p-4 bg-slate-50 rounded-md border border-slate-100 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    Deterministic Safety Engine
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      agentReport.safety.status === 'passed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {agentReport.safety.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  {agentReport.safety.checks.map((chk, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700">{chk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution & Verification Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-sans">Cloud Execution</span>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold ${
                        agentReport.execution.status === 'success'
                          ? 'text-emerald-600'
                          : agentReport.execution.status === 'skipped'
                          ? 'text-slate-500'
                          : 'text-red-600'
                      }`}
                    >
                      {agentReport.execution.status.toUpperCase()}
                    </span>
                  </div>
                  {agentReport.execution.error && (
                    <div className="text-red-600 text-[11px] font-sans pt-1">
                      Reason: <span className="font-mono font-bold">{agentReport.execution.error}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-sans">SLA Verification</span>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold ${
                        agentReport.verification.status === 'passed'
                          ? 'text-emerald-600'
                          : agentReport.verification.status === 'not_run'
                          ? 'text-slate-500'
                          : 'text-red-600'
                      }`}
                    >
                      {agentReport.verification.status.toUpperCase()}
                    </span>
                  </div>
                  {agentReport.verification.actual_instances !== undefined && (
                    <div className="text-slate-600 text-[11px] font-sans">
                      Verified instances:{' '}
                      <span className="font-mono font-bold text-slate-900">
                        {agentReport.verification.actual_instances}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
