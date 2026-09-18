import React from 'react';
import { SlidersHorizontal, Shield, Zap, Scale } from 'lucide-react';

interface SlaRiskSliderProps {
  value: number; // 0, 1, or 2
  onChange: (val: number) => void;
}

export const SlaRiskSlider: React.FC<SlaRiskSliderProps> = ({ value, onChange }) => {
  const modes = [
    {
      id: 0,
      label: 'Aggressive Savings',
      desc: 'Prioritizes cost reduction; minimizes capacity headroom above latency SLA.',
      color: 'text-amber-700',
      badge: 'Max Savings',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 1,
      label: 'Balanced Optimization',
      desc: 'Recommended policy; maintains safe capacity headroom and latency buffers.',
      color: 'text-blue-700',
      badge: 'Recommended',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 2,
      label: 'Max Availability / Zero Risk',
      desc: 'Prioritizes SLA uptime; preserves redundant nodes under all traffic conditions.',
      color: 'text-emerald-700',
      badge: 'Highest Uptime',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  const current = modes[value] || modes[1];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-tight">
              What-If SLA Risk Policy
            </h3>
            <p className="text-[11px] text-slate-500">Tune the cost vs SLA safety sensitivity curve</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500 text-[11px]">Policy:</span>
          <span className={`font-bold ${current.color}`}>{current.label}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${current.badgeBg}`}>
            {current.badge}
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <input
          type="range"
          min="0"
          max="2"
          step="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 border border-slate-200"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-0.5">
          <span className={value === 0 ? 'text-amber-700 font-bold' : ''}>Aggressive Savings</span>
          <span className={value === 1 ? 'text-blue-700 font-bold' : ''}>Balanced</span>
          <span className={value === 2 ? 'text-emerald-700 font-bold' : ''}>Max Availability</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
        {current.desc}
      </p>
    </div>
  );
};
