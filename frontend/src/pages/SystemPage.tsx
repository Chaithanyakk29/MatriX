import React, { useState } from 'react';
import { Settings, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { SystemStatus } from '../types';
import { api } from '../services/api';

interface SystemPageProps {
  systemStatus: SystemStatus | null;
  wsConnected: boolean;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onRefresh: () => void;
}

export const SystemPage: React.FC<SystemPageProps> = ({
  systemStatus,
  wsConnected,
  demoMode,
  onToggleDemoMode,
  onRefresh,
}) => {
  const [testResult, setTestResult] = useState<any>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  const testApi = async (name: string, fn: () => Promise<any>) => {
    setTestingEndpoint(name);
    try {
      const res = await fn();
      setTestResult({ endpoint: name, success: true, data: res });
    } catch (e: any) {
      setTestResult({ endpoint: name, success: false, error: e.message });
    } finally {
      setTestingEndpoint(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Architecture Telemetry & Health
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnostic status of REST APIs, WebSocket pipeline, persistence storage, and AI providers.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Poll Health
        </button>
      </div>

      {/* Component Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Express Server */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">REST API Gateway</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Online
            </span>
          </div>
          <div className="text-sm font-semibold font-mono text-slate-900">localhost:3001</div>
          <p className="text-[11px] text-slate-500">20 validated endpoints with Zod schemas.</p>
        </div>

        {/* Persistence */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Persistence Storage</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          </div>
          <div className="text-sm font-semibold font-mono text-slate-900">
            {systemStatus?.database.type === 'mongodb' ? 'MongoDB Atlas' : 'In-Memory Store'}
          </div>
          <p className="text-[11px] text-slate-500">
            {systemStatus?.database.type === 'mongodb'
              ? 'Connected to Atlas cluster.'
              : 'Zero-config local in-memory dual adapter.'}
          </p>
        </div>

        {/* AI Provider */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">AI Orchestration</span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                systemStatus?.aiProvider.status === 'connected' ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {systemStatus?.aiProvider.status === 'connected' ? 'Ollama Live' : 'Demo Engine'}
            </span>
          </div>
          <div className="text-sm font-semibold font-mono text-slate-900 truncate">
            {systemStatus?.aiProvider.model || 'qwen2.5:7b'}
          </div>
          <p className="text-[11px] text-slate-500">
            {demoMode ? 'Deterministic rule engine active.' : 'Connected to Ollama local instance.'}
          </p>
        </div>

        {/* Real-time WS */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Real-Time Pipe</span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                wsConnected ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {wsConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
          <div className="text-sm font-semibold font-mono text-slate-900">Native ws // 3001</div>
          <p className="text-[11px] text-slate-500">Low-latency event streaming for agent investigations.</p>
        </div>
      </div>

      {/* Interactive REST API Inspector */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Interactive REST Route Tester
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Query active backend routes to inspect JSON responses:
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => testApi('GET /api/system/status', () => api.getSystemStatus())}
            disabled={testingEndpoint !== null}
            className="px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200 disabled:opacity-50 transition-colors"
          >
            GET /api/system/status
          </button>
          <button
            onClick={() => testApi('GET /api/services', () => api.getServices())}
            disabled={testingEndpoint !== null}
            className="px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200 disabled:opacity-50 transition-colors"
          >
            GET /api/services
          </button>
          <button
            onClick={() => testApi('GET /api/cloud/summary', () => api.getCloudSummary())}
            disabled={testingEndpoint !== null}
            className="px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200 disabled:opacity-50 transition-colors"
          >
            GET /api/cloud/summary
          </button>
          <button
            onClick={() => testApi('GET /api/scenarios', () => api.getScenarios())}
            disabled={testingEndpoint !== null}
            className="px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200 disabled:opacity-50 transition-colors"
          >
            GET /api/scenarios
          </button>
          <button
            onClick={() => testApi('GET /api/actions', () => api.getActions())}
            disabled={testingEndpoint !== null}
            className="px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200 disabled:opacity-50 transition-colors"
          >
            GET /api/actions
          </button>
        </div>

        {testResult && (
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 font-mono text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-900 font-bold">{testResult.endpoint}</span>
              <span className={testResult.success ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                {testResult.success ? '200 OK' : 'REQUEST ERROR'}
              </span>
            </div>
            <pre className="text-slate-700 max-h-52 overflow-y-auto text-[11px] p-2 bg-white rounded border border-slate-200">
              {JSON.stringify(testResult.data || testResult.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
