import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AnomalyBanner } from './components/AnomalyBanner';
import { HitlModal } from './components/HitlModal';
import { AgentStep } from './components/AgentLiveStepper';
import { DashboardPage } from './pages/DashboardPage';
import { ServicesPage } from './pages/ServicesPage';
import { AgentPage } from './pages/AgentPage';
import { ActionsPage } from './pages/ActionsPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { SystemPage } from './pages/SystemPage';
import { api } from './services/api';
import {
  Service,
  CloudSummary,
  CostHistoryPoint,
  InstanceHistoryPoint,
  ActionRecord,
  AgentFinalReport,
  Scenario,
  SystemStatus,
  WsEvent,
} from './types';

const WS_URL = 'ws://localhost:3001';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [summary, setSummary] = useState<CloudSummary | null>(null);
  const [costHistory, setCostHistory] = useState<CostHistoryPoint[]>([]);
  const [instanceHistory, setInstanceHistory] = useState<InstanceHistoryPoint[]>([]);
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Agent State
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);
  const [agentReport, setAgentReport] = useState<AgentFinalReport | null>(null);
  const [events, setEvents] = useState<WsEvent[]>([]);
  const [demoMode, setDemoModeState] = useState<boolean>(true);

  // Feature 2: Stepper Loop State
  const [activeStepperStep, setActiveStepperStep] = useState<AgentStep>('idle');

  // Feature 3: HITL Guardrail Modal State
  const [isHitlOpen, setIsHitlOpen] = useState<boolean>(false);

  // Feature 4: What-If SLA Risk Slider State (0: Aggressive, 1: Balanced, 2: Max Availability)
  const [slaRiskLevel, setSlaRiskLevel] = useState<number>(1);

  // WebSocket Connection
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial telemetry
  const refreshAllData = useCallback(async () => {
    try {
      const [sList, sum, cH, iH, actList, scList, sys] = await Promise.all([
        api.getServices(),
        api.getCloudSummary(),
        api.getCostHistory(),
        api.getInstanceHistory(),
        api.getActions(),
        api.getScenarios(),
        api.getSystemStatus(),
      ]);

      setServices(sList);
      setSummary(sum);
      setCostHistory(cH);
      setInstanceHistory(iH);
      setActions(actList);
      setScenarios(scList);
      setSystemStatus(sys);
      setDemoModeState(sys.aiProvider.activeMode.includes('deterministic'));
    } catch (err) {
      console.error('Failed to load telemetry from backend:', err);
    }
  }, []);

  // WebSocket Setup with auto-reconnect
  useEffect(() => {
    refreshAllData();

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data: WsEvent = JSON.parse(event.data);
            setEvents((prev) => [...prev, data]);

            // Sync Stepper Step based on WebSocket Event Types
            if (data.type.includes('investigation') || data.type.includes('metric') || data.type.includes('agent_started')) {
              setActiveStepperStep('think');
            } else if (data.type.includes('safety') || data.type.includes('decision')) {
              setActiveStepperStep('decide');
            } else if (data.type.includes('action') || data.type.includes('verification')) {
              setActiveStepperStep('act');
            } else if (data.type.includes('completed')) {
              setActiveStepperStep('completed');
            }

            // Auto-refresh telemetry on state mutation events
            if (data.type === 'action_succeeded' || data.type === 'cloud_updated') {
              refreshAllData();
            }
          } catch (e) {
            console.error('Failed to parse WebSocket event:', e);
          }
        };

        socket.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        socket.onerror = () => {
          setWsConnected(false);
        };

        wsRef.current = socket;
      } catch (err) {
        console.error('WebSocket connection error:', err);
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [refreshAllData]);

  // Handler: Run Agent
  const handleRunAgent = async (prompt: string) => {
    setIsAgentRunning(true);
    setAgentReport(null);
    setActiveStepperStep('think');

    try {
      const report = await api.runAgent(prompt);
      setAgentReport(report);
      setActiveStepperStep('completed');
      await refreshAllData();
    } catch (err: any) {
      console.error('Agent invocation failed:', err);
      setActiveStepperStep('idle');
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Handler: Load Scenario
  const handleLoadScenario = async (scenarioId: string) => {
    try {
      await api.loadScenario(scenarioId);
      await refreshAllData();
    } catch (err) {
      console.error('Failed to load scenario:', err);
    }
  };

  // Handler: Reset Scenarios
  const handleResetScenarios = async () => {
    try {
      await api.resetScenarios();
      await refreshAllData();
    } catch (err) {
      console.error('Failed to reset scenarios:', err);
    }
  };

  // Handler: Toggle Demo Mode
  const handleToggleDemoMode = async () => {
    const next = !demoMode;
    try {
      await api.setDemoMode(next);
      setDemoModeState(next);
      const sys = await api.getSystemStatus();
      setSystemStatus(sys);
    } catch (e) {
      console.error('Failed to toggle demo mode:', e);
    }
  };

  // Handler: Load Scenario & Navigate to Agent
  const handleLoadScenarioAndRun = async (scenarioId: string, prompt: string) => {
    await handleLoadScenario(scenarioId);
    setActiveTab('agent');
    await handleRunAgent(prompt);
  };

  // Feature 1 Handler: Investigate Anomaly Banner
  const handleInvestigateAnomaly = () => {
    setActiveTab('agent');
    handleRunAgent('Review the current services and reduce unnecessary cost without breaking the latency or availability requirements.');
  };

  // Feature 3 Handler: HITL Approve Action
  const handleHitlApprove = async () => {
    setIsHitlOpen(false);
    setActiveTab('agent');
    await handleRunAgent('Orders traffic is high; safely optimize orders-api instances.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Feature 1: The "Monday Morning Anomaly" Banner */}
      <AnomalyBanner onInvestigate={handleInvestigateAnomaly} />

      {/* Feature 3: Human-in-the-Loop (HITL) Guardrail Modal */}
      <HitlModal
        isOpen={isHitlOpen}
        onApprove={handleHitlApprove}
        onReject={() => setIsHitlOpen(false)}
        targetService="orders-api"
        proposedAction="Scale Down orders-api (5 → 3)"
        projectedSavings="$40.00/hr"
      />

      <div className="flex-1 flex min-h-0">
        {/* Fixed Enterprise Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeScenario={summary?.activeScenario || 'default'}
          demoMode={demoMode}
          onToggleDemoMode={handleToggleDemoMode}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            activeTab={activeTab}
            wsConnected={wsConnected}
            aiMode={systemStatus?.aiProvider.provider || 'Qwen Local'}
            demoMode={demoMode}
            onResetFleet={handleResetScenarios}
            onTriggerHitl={() => setIsHitlOpen(true)}
          />

          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardPage
                summary={summary}
                costHistory={costHistory}
                instanceHistory={instanceHistory}
                services={services}
                recentEvents={events}
                onNavigateTab={(t) => setActiveTab(t)}
                onQuickRun={(p) => {
                  setActiveTab('agent');
                  handleRunAgent(p);
                }}
                isAgentRunning={isAgentRunning}
                slaRiskLevel={slaRiskLevel}
                onSlaRiskChange={setSlaRiskLevel}
              />
            )}

            {activeTab === 'services' && (
              <ServicesPage
                services={services}
                onRefresh={refreshAllData}
                onLoadScenario={handleLoadScenario}
                onResetScenarios={handleResetScenarios}
                onNavigateToAgent={(p) => {
                  setActiveTab('agent');
                  handleRunAgent(p);
                }}
                activeScenarioId={summary?.activeScenario || 'default'}
              />
            )}

            {activeTab === 'agent' && (
              <AgentPage
                onRunAgent={handleRunAgent}
                isAgentRunning={isAgentRunning}
                agentReport={agentReport}
                events={events}
                onClearEvents={() => setEvents([])}
                onLoadScenarioAndRun={handleLoadScenarioAndRun}
                activeStepperStep={activeStepperStep}
              />
            )}

            {activeTab === 'actions' && (
              <ActionsPage actions={actions} onRefresh={refreshAllData} />
            )}

            {activeTab === 'scenarios' && (
              <ScenariosPage
                scenarios={scenarios}
                activeScenarioId={summary?.activeScenario || 'default'}
                onLoadScenario={handleLoadScenario}
                onResetScenarios={handleResetScenarios}
                onNavigateToAgent={(p) => {
                  setActiveTab('agent');
                  handleRunAgent(p);
                }}
              />
            )}

            {activeTab === 'system' && (
              <SystemPage
                systemStatus={systemStatus}
                wsConnected={wsConnected}
                demoMode={demoMode}
                onToggleDemoMode={handleToggleDemoMode}
                onRefresh={refreshAllData}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
