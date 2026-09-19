import React from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  wsConnected: boolean;
  aiMode: string;
  demoMode: boolean;
  onResetFleet: () => Promise<void>;
  onTriggerHitl?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  wsConnected,
  aiMode,
  demoMode,
  onResetFleet,
  onTriggerHitl,
}) => {

  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'NCR Atleos SRE Mission Control',
      subtitle: 'Real-time compute provisioning, SLA latency boundaries, and automated cost optimization.',
    },
    services: {
      title: 'Monitored Cloud Fleet',
      subtitle: 'Inventory of active cloud microservices with latency SLA policies and capacities.',
    },
    agent: {
      title: 'Autonomous Agent Console',
      subtitle: 'Think. Decide. Act. loop with deterministic safety guardrails and SLA verification.',
    },
    actions: {
      title: 'Action Audit Trail',
      subtitle: 'Immutable record of cloud scaling mutations, safety engine validations, and SLA checks.',
    },
    scenarios: {
      title: 'Incident & Benchmark Scenarios',
      subtitle: 'Simulated infrastructure conditions to test cost optimization, traffic surge, and safety guards.',
    },
    system: {
      title: 'System & Diagnostics',
      subtitle: 'Backend API telemetry, persistence health, and LLM orchestration status.',
    },
  };

  const current = titles[activeTab] || { title: 'Overview', subtitle: '' };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div>
        <h1 className="text-sm font-semibold text-slate-900 tracking-tight">{current.title}</h1>
        <p className="text-[11px] text-slate-500 hidden sm:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Google Cloud GKE & LangGraph Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-900">GCP us-central1</span>
          <span className="text-slate-300">•</span>
          <span className="text-blue-600 font-semibold">GKE Autopilot</span>
          <span className="text-slate-300">•</span>
          <span className="text-indigo-600 font-bold">LangGraph v1.4</span>
        </div>

        {/* Trigger HITL Guardrail Button (Demo helper) */}
        {onTriggerHitl && (
          <button
            onClick={onTriggerHitl}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
            title="Simulate High-Risk Action requiring Human In The Loop approval"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Test HITL</span>
          </button>
        )}

        {/* Reset Fleet Button */}
        <button
          onClick={onResetFleet}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          title="Reset simulated services back to default baseline"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
