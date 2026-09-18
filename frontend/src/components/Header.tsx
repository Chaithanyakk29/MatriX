import React from 'react';
import { RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  wsConnected: boolean;
  aiMode: string;
  demoMode: boolean;
  onResetFleet: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  wsConnected,
  aiMode,
  demoMode,
  onResetFleet,
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Cloud Cost Overview',
      subtitle: 'Real-time compute provisioning, utilization telemetry, and spend waste detection.',
    },
    services: {
      title: 'Monitored Services',
      subtitle: 'Inventory of active cloud microservices with latency SLA policies and capacities.',
    },
    agent: {
      title: 'Autonomous Agent Console',
      subtitle: 'Goal-driven optimization workflows with deterministic safety checks and verification.',
    },
    actions: {
      title: 'Action Audit Trail',
      subtitle: 'Immutable record of cloud scaling mutations, safety engine validations, and SLA checks.',
    },
    scenarios: {
      title: 'Benchmark Scenarios',
      subtitle: 'Simulated infrastructure conditions to test cost optimization, traffic surge, and safety guards.',
    },
    system: {
      title: 'System & Diagnostics',
      subtitle: 'Backend API telemetry, persistence health, and LLM orchestration status.',
    },
  };

  const current = titles[activeTab] || { title: 'Overview', subtitle: '' };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-xs px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-sm font-semibold text-slate-900">{current.title}</h1>
        <p className="text-[11px] text-slate-500 hidden sm:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time Status Badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-mono"
          title={wsConnected ? 'Real-time WebSocket pipe active' : 'Disconnected from WebSocket'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              wsConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="text-slate-700 text-[11px] font-medium">
            {wsConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Engine Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
          <span className="text-slate-400">Engine:</span>
          <span className="text-slate-900 font-medium">
            {demoMode ? 'Deterministic Rule Engine' : aiMode || 'Ollama Qwen'}
          </span>
        </div>

        {/* Reset Fleet Button */}
        <button
          onClick={onResetFleet}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          title="Reset simulated services back to default baseline"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Reset Fleet</span>
        </button>
      </div>
    </header>
  );
};
