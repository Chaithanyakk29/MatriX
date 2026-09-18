import React, { useState } from 'react';
import { AlertOctagon, ArrowRight, X, ShieldAlert } from 'lucide-react';

interface AnomalyBannerProps {
  onInvestigate: () => void;
}

export const AnomalyBanner: React.FC<AnomalyBannerProps> = ({ onInvestigate }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full bg-amber-50/95 backdrop-blur-md border-b border-amber-200/90 px-4 py-2 text-xs text-amber-900 sticky top-0 z-50 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 font-mono">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-bold text-amber-950 tracking-wide flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            ACTIVE ALERT: Incident #37
          </span>
          <span className="text-amber-400 hidden md:inline">—</span>
          <span className="text-amber-800">
            Cloud spend <strong className="text-amber-950 underline decoration-amber-400 font-semibold">+37% vs Baseline</strong>. Root cause unknown.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onInvestigate}
            className="px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Investigate Anomaly</span>
            <ArrowRight className="w-3 h-3 text-amber-100" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md hover:bg-amber-100 text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
            title="Dismiss Alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
