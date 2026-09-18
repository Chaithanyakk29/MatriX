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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 tracking-tight text-sm">CloudGuard</div>
            <div className="text-[11px] text-slate-500 font-medium">Cloud Cost Intelligence</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs'
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
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
        <div className="p-3 rounded-md bg-white border border-slate-200/80 text-xs space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Scenario
            </span>
            <span className="font-mono text-slate-800 font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
              {activeScenario}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Deterministic Mode</span>
            <button
              onClick={onToggleDemoMode}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-hidden ${
                demoMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  demoMode ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 text-center font-mono py-1">
          CloudGuard AI v2.4 • Enterprise
        </div>
      </div>
    </aside>
  );
};
