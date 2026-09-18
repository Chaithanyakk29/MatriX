import React from 'react';
import { Eye, ShieldCheck, Zap, CheckCircle2, Circle } from 'lucide-react';

export type AgentStep = 'idle' | 'think' | 'decide' | 'act' | 'completed';

interface AgentLiveStepperProps {
  currentStep: AgentStep;
  isAgentRunning: boolean;
}

export const AgentLiveStepper: React.FC<AgentLiveStepperProps> = ({ currentStep, isAgentRunning }) => {
  const steps = [
    {
      id: 'think',
      number: '01',
      title: 'Think',
      subtitle: 'Observe',
      icon: Eye,
      color: 'blue',
    },
    {
      id: 'decide',
      number: '02',
      title: 'Decide',
      subtitle: 'Safety Gate',
      icon: ShieldCheck,
      color: 'amber',
    },
    {
      id: 'act',
      number: '03',
      title: 'Act',
      subtitle: 'Mutate & Verify',
      icon: Zap,
      color: 'emerald',
    },
  ];

  const getStepStatus = (stepId: string) => {
    if (!isAgentRunning && currentStep === 'completed') return 'completed';
    if (!isAgentRunning) return 'idle';

    if (stepId === 'think') {
      if (currentStep === 'think') return 'active';
      if (currentStep === 'decide' || currentStep === 'act' || currentStep === 'completed') return 'completed';
    }
    if (stepId === 'decide') {
      if (currentStep === 'decide') return 'active';
      if (currentStep === 'act' || currentStep === 'completed') return 'completed';
    }
    if (stepId === 'act') {
      if (currentStep === 'act') return 'active';
      if (currentStep === 'completed') return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-semibold">
          <span className={`w-2 h-2 rounded-full ${isAgentRunning ? 'bg-blue-600 animate-ping' : 'bg-emerald-500'}`} />
          Execution Loop
        </span>
        <span className="text-[11px] font-mono text-slate-500">
          {isAgentRunning ? (
            <span className="text-blue-600 font-semibold uppercase">Phase: {currentStep}</span>
          ) : currentStep === 'completed' ? (
            <span className="text-emerald-600 font-semibold">Complete</span>
          ) : (
            'Standby'
          )}
        </span>
      </div>

      {/* 3 Step Connected Cards */}
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;

          let cardStyle = 'border-slate-200/80 bg-slate-50 text-slate-400';
          let iconStyle = 'bg-slate-200/70 text-slate-500';
          let badgeText = 'Pending';
          let badgeStyle = 'bg-slate-200/60 text-slate-500';

          if (status === 'active') {
            cardStyle = 'border-blue-300 bg-blue-50 text-blue-900 ring-1 ring-blue-400/30';
            iconStyle = 'bg-blue-600 text-white animate-pulse';
            badgeText = 'Running';
            badgeStyle = 'bg-blue-200 text-blue-800 font-semibold';
          } else if (status === 'completed') {
            cardStyle = 'border-emerald-200 bg-emerald-50/50 text-slate-700';
            iconStyle = 'bg-emerald-100 text-emerald-700';
            badgeText = 'Done';
            badgeStyle = 'bg-emerald-100 text-emerald-800 font-semibold';
          }

          return (
            <div
              key={step.id}
              className={`p-2 rounded-lg border flex flex-col justify-between transition-all ${cardStyle}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  {step.number}
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${iconStyle}`}>
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold tracking-tight text-slate-900">
                  {step.title}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {step.subtitle}
                </div>
              </div>

              <div className="mt-2 pt-1 border-t border-slate-200/40 flex items-center justify-between">
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${badgeStyle}`}>
                  {badgeText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
