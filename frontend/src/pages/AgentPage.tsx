import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Bot,
  Plus,
  PanelRightOpen,
  PanelRightClose,
  X,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  ChevronRight,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { AgentFinalReport, WsEvent } from '../types';
import { AgentLiveStepper, AgentStep } from '../components/AgentLiveStepper';
import { RichChatCard } from '../components/RichChatCard';
import { AgentEventChain } from '../components/AgentEventChain';

interface AgentPageProps {
  onRunAgent: (prompt: string) => Promise<void>;
  isAgentRunning: boolean;
  agentReport: AgentFinalReport | null;
  events: WsEvent[];
  onClearEvents: () => void;
  onLoadScenarioAndRun?: (scenarioId: string, prompt: string) => Promise<void>;
  activeStepperStep: AgentStep;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  report?: AgentFinalReport;
  eventsSnapshot?: WsEvent[];
  timestamp: Date;
}

function formatAgentExplanation(report: AgentFinalReport): string {
  if (report.decision.action === 'scale_down') {
    return `I analyzed your cloud fleet and detected that **${report.problem.service}** had excess idle capacity (${report.problem.reason}).\n\nTo optimize cloud spend without impacting throughput or latency, I safely scaled **${report.problem.service}** down from **${report.decision.from_instances}** to **${report.decision.to_instances} instances**.\n\nAll safety guardrails passed, yielding an estimated savings of **$${report.estimated_savings_per_hour.toFixed(2)}/hr**.`;
  }
  if (report.decision.action === 'scale_up') {
    return `I monitored the fleet and detected an elevated load on **${report.problem.service}** (${report.problem.reason}).\n\nTo safeguard your latency SLAs and avoid throttling, I scaled **${report.problem.service}** up from **${report.decision.from_instances}** to **${report.decision.to_instances} instances**.\n\nLatency has stabilized at ${report.verification.latency_ms || 180}ms, well within safe operational boundaries.`;
  }
  if (report.safety.status === 'rejected') {
    return `I evaluated **${report.problem.service}** based on your directive, but the deterministic safety engine blocked the action:\n\n• ${report.problem.reason}\n\nTo ensure service availability and prevent accidental disruption, no scaling changes were executed.`;
  }
  if (report.execution.status === 'failed') {
    return `I attempted to adjust capacity on **${report.problem.service}**, but encountered a simulated cloud capacity error: ${report.execution.error || 'Capacity temporarily unavailable'}.\n\nThe automated safety rollback kept the service at ${report.decision.from_instances} instances.`;
  }
  if (typeof report.summary === 'object' && report.summary !== null) {
    const formatVal = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
      if (Array.isArray(val)) return val.map(formatVal).join(', ');
      if (typeof val === 'object') {
        return Object.entries(val)
          .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${formatVal(v)}`)
          .join('; ');
      }
      return String(val);
    };

    return Object.entries(report.summary)
      .map(([k, v]) => `• **${k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}**: ${formatVal(v)}`)
      .join('\n');
  }
  return typeof report.summary === 'string' ? report.summary : 'I analyzed your cloud fleet. All services are currently balanced and operating within safe SLA and cost parameters.';
}

function parseInlineFormatting(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong
          key={idx}
          className="font-bold text-slate-900 bg-slate-100/90 border border-slate-200/70 px-1.5 py-0.5 rounded text-inherit"
        >
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200/60 font-mono text-[13px] text-blue-700 font-bold"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}

function renderFormattedMarkdown(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-3.5 text-[15px] sm:text-[16px] text-slate-800 leading-relaxed font-normal">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');
        const hasBullets = lines.some((l) => /^\s*[•\-\*]\s+/.test(l));

        if (hasBullets) {
          return (
            <div key={pIdx} className="space-y-2 my-2">
              {lines.map((line, lIdx) => {
                const bulletMatch = line.match(/^(\s*)([•\-\*])\s+(.*)$/);
                if (bulletMatch) {
                  const indentLevel = Math.floor(bulletMatch[1].length / 2);
                  const cleanContent = bulletMatch[3];
                  return (
                    <div
                      key={lIdx}
                      className={`flex items-start gap-2.5 ${indentLevel > 0 ? 'ml-5' : 'ml-1'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 shrink-0" />
                      <div className="flex-1 text-[15px] sm:text-[16px] leading-relaxed">
                        {parseInlineFormatting(cleanContent)}
                      </div>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="font-semibold text-slate-900 pt-1">
                    {parseInlineFormatting(line)}
                  </p>
                );
              })}
            </div>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {parseInlineFormatting(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export const AgentPage: React.FC<AgentPageProps> = ({
  onRunAgent,
  isAgentRunning,
  agentReport,
  events,
  onClearEvents,
  onLoadScenarioAndRun,
  activeStepperStep,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  // Expandable side panel state: collapsed by default, pushes chat aside when expanded
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<AgentFinalReport | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 4 Pill-shaped quick presets
  const pillPresets = [
    {
      id: 'testA',
      label: 'Test A: Optimize',
      title: 'Cost Optimization',
      subtitle: 'Downscale idle reports-worker safely from 4 to 1 node',
      prompt: 'Review the current services and reduce unnecessary cost without breaking the latency or availability requirements.',
    },
    {
      id: 'testB',
      label: 'Test B: SLA Surge',
      title: 'Traffic Surge Defense',
      subtitle: 'Scale orders-api to protect latency boundary during high traffic',
      prompt: 'Orders traffic is increasing. Keep the service within its latency target.',
    },
    {
      id: 'testC',
      label: 'Test C: Stale Data',
      title: 'Stale Metric Intercept',
      subtitle: 'Block dangerous downscaling when local cache is out of date',
      prompt: 'Reduce cost if it is safe.',
    },
    {
      id: 'testD',
      label: 'Test D: Cloud Fault',
      title: 'Capacity Failure Handling',
      subtitle: 'Safely handle simulated cloud capacity errors on payment-api',
      prompt: 'Scale the payment service only if the current state requires it.',
    },
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentRunning]);

  // Sync latest completed report into messages and open panel ONLY if an action was needed
  useEffect(() => {
    if (agentReport) {
      setSelectedReport(agentReport);

      // Open the agent panel ONLY when an agent action is needed/executed.
      // If the LLM simply answered (no_action), do NOT slide or open the agent panel.
      const hasAction =
        agentReport.decision.action !== 'no_action' &&
        agentReport.decision.action !== 'none' &&
        agentReport.decision.action !== 'hold';

      if (hasAction) {
        setIsPanelExpanded(true);
      }

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.report?.runId === agentReport.runId) {
          return prev;
        }
        return [
          ...prev,
          {
            id: 'asst-' + Date.now(),
            role: 'assistant',
            content: formatAgentExplanation(agentReport),
            report: agentReport,
            eventsSnapshot: [...events],
            timestamp: new Date(),
          },
        ];
      });
    }
  }, [agentReport]);

  // If a live mutation action or safety gate check starts during execution, open panel
  useEffect(() => {
    const lastEvent = events[events.length - 1];
    if (
      lastEvent &&
      (lastEvent.type === 'action_started' ||
        lastEvent.type === 'safety_check_started' ||
        lastEvent.type === 'action_succeeded')
    ) {
      setIsPanelExpanded(true);
    }
  }, [events]);

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isAgentRunning) return;

    const userMsg: MessageItem = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');

    await onRunAgent(text);
  };

  const handleSelectPill = async (preset: (typeof pillPresets)[0]) => {
    if (isAgentRunning) return;

    const userMsg: MessageItem = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: preset.prompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');

    if (onLoadScenarioAndRun) {
      await onLoadScenarioAndRun(preset.id, preset.prompt);
    } else {
      await onRunAgent(preset.prompt);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setSelectedReport(null);
    onClearEvents();
  };

  const activeDisplayReport = selectedReport || agentReport;
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content;

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs">
            <Bot className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-900">Agent Conversation</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand / Collapse Tasks Button */}
          <button
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border shadow-2xs transition-all cursor-pointer ${
              isPanelExpanded
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
            }`}
            title={isPanelExpanded ? 'Collapse Task Inspector' : 'Expand Task Inspector'}
          >
            {isPanelExpanded ? (
              <PanelRightClose className="w-4 h-4 text-blue-700" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-blue-600" />
            )}
            <span className="font-semibold">{isPanelExpanded ? 'Collapse Tasks' : 'Expand Tasks'}</span>
            {events.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-mono font-bold">
                {events.length}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Container: Side-by-Side Flex Layout (Exact Same Height) */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden relative">
        {/* Left Pane: Chat Box (Smoothly shrinks and pushes aside when panel expands) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden relative h-full transition-all duration-300">
          {/* Scrollable Message Thread */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 pb-40">
            {/* Empty / Welcome State */}
            {messages.length === 0 && !isAgentRunning && (
              <div className="max-w-xl mx-auto py-12 text-center space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                  <Bot className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                    How can I help optimize your infrastructure?
                  </h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Ask me in plain language to inspect telemetry, scale services, or test benchmark scenarios.
                  </p>
                </div>

                {/* Quick Preset Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  {pillPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPill(preset)}
                      className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 hover:border-slate-300 transition-all text-left group cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">
                          {preset.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded">
                          {preset.label.split(':')[0]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {preset.subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Thread */}
            {messages.map((msg) => (
              <div key={msg.id} className="max-w-2xl mx-auto space-y-2">
                {msg.role === 'user' ? (
                  /* User Bubble */
                  <div className="flex justify-end">
                    <div className="max-w-xl bg-slate-900 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-[14px] sm:text-[15px] font-medium leading-relaxed shadow-xs">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  /* Assistant Bubble */
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Bot className="w-4.5 h-4.5" />
                    </div>

                    <div className="flex-1 space-y-2.5">
                      {/* Natural Conversational Explanation */}
                      <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-5 py-4 text-slate-800 leading-relaxed shadow-xs">
                        {renderFormattedMarkdown(msg.content)}

                        {/* Action Pill with Expand Button (Only shown when an agent mutation was executed or attempted) */}
                        {msg.report &&
                          msg.report.decision.action !== 'no_action' &&
                          msg.report.decision.action !== 'none' && (
                            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200/70 text-blue-700 font-mono text-xs font-semibold">
                                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                                  {`${msg.report.problem.service}: ${msg.report.decision.from_instances} → ${msg.report.decision.to_instances} instances`}
                                </span>

                              {msg.report.estimated_savings_per_hour > 0 && (
                                <span className="text-emerald-700 font-mono font-bold text-xs bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg">
                                  +${msg.report.estimated_savings_per_hour.toFixed(2)}/hr saved
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedReport(msg.report || null);
                                setIsPanelExpanded(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
                              title="Expand task side panel to inspect execution telemetry"
                            >
                              <PanelRightOpen className="w-3.5 h-3.5 text-blue-300" />
                              <span>Expand Tasks</span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Running State */}
            {isAgentRunning && (
              <div className="max-w-2xl mx-auto flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-600 shadow-2xs flex items-center justify-between gap-3 w-full max-w-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Evaluating fleet metrics and deterministic safety rules...</span>
                  </div>

                  {!isPanelExpanded && (
                    <button
                      onClick={() => setIsPanelExpanded(true)}
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold underline flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>Watch Live</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Floating Bottom Input Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-3 pb-3 px-4 sm:px-6 z-20">
            <div className="max-w-2xl mx-auto space-y-2">
              {/* Quick Pill Presets Bar */}
              <div className="flex flex-wrap items-center gap-1.5">
                {pillPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPill(preset)}
                    disabled={isAgentRunning}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-2xs transition-all disabled:opacity-40 cursor-pointer"
                  >
                    [{preset.label}]
                  </button>
                ))}
              </div>

              {/* Input Capsule */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputPrompt);
                }}
                className="flex items-center gap-2 p-1.5 pl-4 rounded-2xl bg-white border border-slate-300 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-blue-100 shadow-xs transition-all"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Ask CloudGuard to scale, optimize, or check services..."
                  disabled={isAgentRunning}
                  className="flex-1 text-xs sm:text-sm bg-transparent text-slate-900 placeholder-slate-400 focus:outline-hidden py-1"
                />
                <button
                  type="submit"
                  disabled={isAgentRunning || !inputPrompt.trim()}
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-slate-900 text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs cursor-pointer"
                  title="Send directive"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Pane: Side Inspector Panel (Exact Same Height, Pushes Chat Aside, No Backdrop) */}
        <aside
          className={`shrink-0 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${
            isPanelExpanded
              ? 'w-[440px] xl:w-[480px] opacity-100'
              : 'w-0 opacity-0 border-0 p-0 overflow-hidden pointer-events-none'
          }`}
        >
          <div className="w-[440px] xl:w-[480px] flex flex-col h-full min-h-0">
            {/* Panel Header */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Agent Execution Chain
                    </h3>
                    {isAgentRunning ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                        Running Chain
                      </span>
                    ) : activeDisplayReport ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Chain Verified
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-400">Standby</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">Autonomous event sequence & safety trace</p>
                </div>
              </div>

              <button
                onClick={() => setIsPanelExpanded(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
                title="Collapse panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Content (Scrollable Chain of Events) */}
            <div className="flex-1 overflow-y-auto p-4">
              <AgentEventChain
                isAgentRunning={isAgentRunning}
                currentStep={activeStepperStep}
                report={activeDisplayReport}
                events={events}
                lastPrompt={lastUserMessage}
              />
            </div>

            {/* Panel Footer */}
            <div className="p-2.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-600" />
                Deterministic Guardrails Active
              </span>
              <button
                onClick={() => setIsPanelExpanded(false)}
                className="text-blue-600 hover:underline cursor-pointer font-medium"
              >
                Hide Panel
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
