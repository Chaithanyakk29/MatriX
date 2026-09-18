import React from 'react';
import { Shield, LayoutDashboard, Server, Bot, History, FlaskConical, Settings, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wsConnected: boolean;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  aiMode: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  wsConnected,
  demoMode,
  onToggleDemoMode,
  aiMode,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'services', label: 'Cloud Services', icon: Server },
    { id: 'agent', label: 'AI Agent Console', icon: Bot },
    { id: 'actions', label: 'Audit Trail', icon: History },
    { id: 'scenarios', label: 'Test Scenarios', icon: FlaskConical },
    { id: 'system', label: 'System & Health', icon: Settings },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 text-blue-400 p-2 rounded-lg border border-blue-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">CloudGuard</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">AI 2.0</span>
              </div>
              <p className="text-[11px] text-slate-400">Autonomous Cloud Cost Optimization</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Real-time Status Badges & Controls */}
          <div className="flex items-center gap-3">
            {/* WebSocket Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
                wsConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
              title={wsConnected ? 'Real-time WebSocket active' : 'Connecting to WebSocket...'}
            >
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <Radio className="w-3 h-3" />
              <span>{wsConnected ? 'LIVE WS' : 'OFFLINE'}</span>
            </div>

            {/* AI Engine Status */}
            <button
              onClick={onToggleDemoMode}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors"
              title="Click to toggle between Ollama and Deterministic Fallback Mode"
            >
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>{demoMode ? 'Demo Mode: ON' : `AI: ${aiMode}`}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
