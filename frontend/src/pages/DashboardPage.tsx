import React from 'react';
import {
  DollarSign,
  TrendingDown,
  Server,
  CheckCircle2,
  ArrowRight,
  Clock,
  Zap,
  Activity,
  AlertTriangle,
  Shield,
  Layers,
  Boxes,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CloudSummary, CostHistoryPoint, InstanceHistoryPoint, WsEvent, Service } from '../types';
import { SlaRiskSlider } from '../components/SlaRiskSlider';

interface DashboardPageProps {
  summary: CloudSummary | null;
  costHistory: CostHistoryPoint[];
  instanceHistory: InstanceHistoryPoint[];
  services: Service[];
  recentEvents: WsEvent[];
  onNavigateTab: (tab: string) => void;
  onQuickRun: (prompt: string) => void;
  isAgentRunning: boolean;
  slaRiskLevel: number;
  onSlaRiskChange: (val: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  costHistory,
  instanceHistory,
  services,
  recentEvents,
  onNavigateTab,
  onQuickRun,
  isAgentRunning,
  slaRiskLevel,
  onSlaRiskChange,
}) => {
  const totalCost = summary?.totalCostPerHour ?? 0;
  const avoidableCost = summary?.avoidableCostPerHour ?? 0;
  const totalInstances = summary?.totalInstances ?? 0;
  const healthyCount = summary?.healthyServices ?? 0;
  const totalServices = summary?.activeServices ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Metrics Row: 4 Clean Enterprise KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hourly Cloud Spend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Hourly Cloud Spend
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
                ${totalCost.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ hr</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-mono">
              ~${(totalCost * 24 * 30).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo estimated run-rate
            </p>
          </div>
        </div>

        {/* Avoidable Idle Waste */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avoidable Idle Waste
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-amber-600 font-mono tracking-tight">
                ${avoidableCost.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ hr</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
              <span className="px-1.5 py-0.2 rounded bg-amber-100 border border-amber-200 text-[10px] font-mono">
                {totalCost > 0 ? ((avoidableCost / totalCost) * 100).toFixed(1) : 0}%
              </span>
              <span>of compute can be safely reclaimed</span>
            </div>
          </div>
        </div>

        {/* Provisioned Fleet Nodes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Provisioned Nodes
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
                {totalInstances}
              </span>
              <span className="text-xs text-slate-500 font-medium">active instances</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Distributed across {totalServices} monitored microservices
            </p>
          </div>
        </div>

        {/* SLA & Health Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              SLA Health Score
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono tracking-tight">
                {healthyCount}/{totalServices}
              </span>
              <span className="text-xs text-slate-500 font-medium">within SLA</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Zero degraded service dependencies</span>
            </div>
          </div>
        </div>
      </div>

      {/* GKE Cluster Architecture Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 rounded-2xl border border-slate-700 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-blue-300">Google Cloud Platform</span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono text-slate-300">GKE: gke-prod-uscentral1-atleos</span>
              <span className="text-slate-400">•</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Kubernetes v1.29
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              4 Microservice Deployments • {totalInstances} Active Pods • Managed autonomously by CloudGuard SRE Controller
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('services')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-sm hover:shadow"
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Inspect GKE Pod Topology</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* What-If SLA Risk Slider */}
      <SlaRiskSlider value={slaRiskLevel} onChange={onSlaRiskChange} />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trend Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Fleet Spend Trajectory
              </h2>
              <p className="text-[11px] text-slate-500">Hourly compute cost vs idle waste trajectory</p>
            </div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              USD / hr
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costHistory} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="costFillLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  tickFormatter={(val) =>
                    new Date(String(val)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}/hr`]}
                  labelFormatter={(lbl: any) => new Date(String(lbl)).toLocaleTimeString()}
                />
                <Area
                  type="monotone"
                  dataKey="totalCostPerHour"
                  name="Hourly Spend"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#costFillLight)"
                />
                <Area
                  type="monotone"
                  dataKey="avoidableCost"
                  name="Avoidable Waste"
                  stroke="#d97706"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity & Load Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Fleet Capacity & CPU Utilization
              </h2>
              <p className="text-[11px] text-slate-500">Provisioned server instances vs aggregate CPU load</p>
            </div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Nodes / %
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={instanceHistory} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  tickFormatter={(val) =>
                    new Date(String(val)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  labelFormatter={(lbl: any) => new Date(String(lbl)).toLocaleTimeString()}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  yAxisId="left"
                  type="stepAfter"
                  dataKey="totalInstances"
                  name="Instances"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="averageCpuPercent"
                  name="Avg CPU %"
                  stroke="#059669"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Services Table & Real-time Operations Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monitored Services Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Services Telemetry
              </h2>
              <p className="text-[11px] text-slate-500">Live compute metrics, throughput, and instance provisioning</p>
            </div>
            <button
              onClick={() => onNavigateTab('services')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>All Services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-semibold font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">CPU</th>
                  <th className="py-3 px-3">Throughput</th>
                  <th className="py-3 px-3">Latency (SLA)</th>
                  <th className="py-3 px-3">Capacity</th>
                  <th className="py-3 px-4 text-right">Cost / hr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {services.map((s) => (
                  <tr key={s.service_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 font-mono text-[11px]">
                      {s.service_id}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            s.healthy ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        <span className={s.healthy ? 'text-slate-700 font-medium' : 'text-red-600 font-bold'}>
                          {s.healthy ? 'Healthy' : 'Degraded'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className={s.cpu_percent > 80 ? 'text-red-600 font-bold' : ''}>
                          {s.cpu_percent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {s.requests_per_minute.toLocaleString()} RPM
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span
                        className={
                          s.latency_ms > s.max_latency_ms
                            ? 'text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200'
                            : 'text-slate-700'
                        }
                      >
                        {s.latency_ms} ms
                      </span>
                      <span className="text-slate-400 text-[10px] ml-1">/ {s.max_latency_ms}ms</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span className="font-semibold text-slate-900">{s.instances}</span>
                      <span className="text-slate-400 text-[10px] ml-1">({s.min_instances}-{s.max_instances})</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-right">
                      ${s.cost_per_hour.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Operations Feed (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Operations Feed
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">WebSocket</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[310px] space-y-2 pr-1 text-xs font-mono">
            {recentEvents.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Clock className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p className="text-[11px]">No active telemetry events.</p>
              </div>
            ) : (
              recentEvents
                .slice(-12)
                .reverse()
                .map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-blue-600 font-semibold uppercase">
                        {evt.type.replace(/_/g, ' ')}
                      </span>
                      <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-700 font-sans text-xs">{evt.message}</p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
