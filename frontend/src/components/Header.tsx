import React, { useState, useEffect } from 'react';
import { RotateCcw, Cloud, ShieldAlert, Mail, ExternalLink, X, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

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
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [alertHistory, setAlertHistory] = useState<any[]>([]);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);

  const fetchAlerts = async () => {
    try {
      const history = await api.getAlertHistory();
      setAlertHistory(history || []);
    } catch (err) {
      console.error('Failed to load alert history:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setTestSentSuccess(false);
    try {
      await api.sendTestAlert();
      await fetchAlerts();
      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 4000);
    } catch (e) {
      console.error('Test alert email failed:', e);
    } finally {
      setIsSendingTest(false);
    }
  };

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
        {/* NCR Atleos Enterprise SRE Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-900">NCR Atleos Fleet</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">us-east-1 (Prod)</span>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-700 font-semibold">SRE Active</span>
        </div>

        {/* Nodemailer Operator Alerts Button */}
        <button
          onClick={() => {
            fetchAlerts();
            setIsMailModalOpen(true);
          }}
          className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          title="Nodemailer Operator Alerts & Dispatch History"
        >
          <Mail className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden sm:inline">Operator Mails</span>
          {alertHistory.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold leading-none">
              {alertHistory.length}
            </span>
          )}
        </button>

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

      {/* Operator Email Alerts Modal */}
      {isMailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Nodemailer Operator Alerts Log</h3>
                  <p className="text-[11px] text-slate-500">
                    Dispatched to <span className="font-mono font-medium text-slate-700">sre-operator@atleos.com</span> on telemetry anomalies
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3 text-blue-300" />
                  <span>{isSendingTest ? 'Sending...' : 'Send Test Mail'}</span>
                </button>
                <button
                  onClick={() => setIsMailModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Test alert feedback toast */}
            {testSentSuccess && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center gap-2 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Test anomaly alert email dispatched via Nodemailer! Click below to view live Ethereal email preview.</span>
              </div>
            )}

            {/* Modal Content / Alert List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {alertHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Mail className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">No anomaly alert emails dispatched yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Run an agent prompt or click 'Send Test Mail' above to test the Nodemailer pipeline.
                  </p>
                </div>
              ) : (
                alertHistory.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="font-mono font-bold text-slate-800">{alert.serviceId}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {alert.previewUrl && (
                        <a
                          href={alert.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-medium transition-colors"
                        >
                          <span>Preview Email</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <p className="font-medium text-slate-800 text-[13px]">{alert.subject}</p>

                    <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>Recipient: {alert.recipient}</span>
                      <span className="text-emerald-600 font-bold uppercase">{alert.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Nodemailer v6.10 • SMTP / Ethereal Transport</span>
              <span>Autonomous SRE Incident Alerting</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
