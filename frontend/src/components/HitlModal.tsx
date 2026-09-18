import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, XCircle, CheckCircle2, Clock } from 'lucide-react';

interface HitlModalProps {
  isOpen: boolean;
  onApprove: () => void;
  onReject: () => void;
  targetService?: string;
  proposedAction?: string;
  projectedSavings?: string;
}

export const HitlModal: React.FC<HitlModalProps> = ({
  isOpen,
  onApprove,
  onReject,
  targetService = 'orders-api',
  proposedAction = 'Scale Down orders-api (5 → 3)',
  projectedSavings = '$40.00/hr',
}) => {
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(15);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject(); // Auto-reject on timeout for strict safety
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onReject]);

  if (!isOpen) return null;

  const percentage = (timeLeft / 15) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-amber-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden space-y-5">
        {/* Amber Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-red-400 to-amber-400" />

        {/* Modal Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 font-bold">
              HITL Guardrail Intercept
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              High-Risk Action Detected: Human Approval Required
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-slate-500">Agent Proposal:</span>
            <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
              {proposedAction}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-slate-500">Target Resource:</span>
            <span className="font-mono text-blue-600 font-semibold">{targetService}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Projected Financial Impact:</span>
            <span className="font-mono text-emerald-600 font-bold text-sm">+{projectedSavings}</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The deterministic safety engine identified this downscaling action as a tier-1 critical mutation. Execution requires manual operator consent.
        </p>

        {/* 15-second Countdown Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Safety Auto-Abort Timer:
            </span>
            <span className="font-bold text-amber-700">{timeLeft}s remaining</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onReject}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <XCircle className="w-4 h-4 text-red-500" />
            Reject (Abort)
          </button>
          <button
            onClick={onApprove}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve (Execute)
          </button>
        </div>
      </div>
    </div>
  );
};
