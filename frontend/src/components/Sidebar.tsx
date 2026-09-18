import React from 'react';
import {
  LayoutDashboard,
  Server,
  Terminal,
  Activity,
  Sliders,
  Settings,
  Shield,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeScenario: string;
  demoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeScenario,
  demoMode,
  onToggleDemoMode,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'services', label: 'Services', icon: Server },
    { id: 'agent', label: 'Agent Console', icon: Terminal },
    { id: 'actions', label: 'Action History', icon: Activity },
    { id: 'scenarios', label: 'Scenarios', icon: Sliders },
    { id: 'system', label: 'System', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none shadow-2xs">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight text-sm">CloudGuard AI</div>
            <div className="text-[10px] text-slate-500 font-medium">NCR Atleos SRE Mission Control</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            Operations Console
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Context Card */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/50">
        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Scenario
            </span>
            <span className="font-mono text-blue-700 font-semibold px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[10px]">
              {activeScenario}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-600">Rule Engine</span>
            <button
              onClick={onToggleDemoMode}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                demoMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-2xs ${
                  demoMode ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 text-center font-mono py-1">
          NCR Atleos SRE v2.5 • Mission Control
        </div>
      </div>
    </aside>
  );
};
