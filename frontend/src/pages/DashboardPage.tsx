import React from 'react';
import {
  DollarSign,
  TrendingDown,
  Server,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  ArrowRight,
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

interface DashboardPageProps {
  summary: CloudSummary | null;
  costHistory: CostHistoryPoint[];
  instanceHistory: InstanceHistoryPoint[];
  services: Service[];
  recentEvents: WsEvent[];
  onNavigateTab: (tab: string) => void;
  onQuickRun: (prompt: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  costHistory,
  instanceHistory,
  services,
  recentEvents,
  onNavigateTab,
  onQuickRun,
}) => {
  const totalCost = summary?.totalCostPerHour ?? 0;
  const avoidableCost = summary?.avoidableCostPerHour ?? 0;
  const totalInstances = summary?.totalInstances ?? 0;
  const healthyCount = summary?.healthyServices ?? 0;
  const totalServices = summary?.activeServices ?? 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hourly Cost Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Hourly Cost</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-slate-900 font-mono tracking-tight">
              ${totalCost.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-normal">/ hour</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Est. ${(totalCost * 24 * 30).toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
          </div>
        </div>

        {/* Avoidable Spend */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avoidable Waste</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-slate-900 font-mono tracking-tight">
              ${avoidableCost.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-normal">/ hour</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-medium">
            {totalCost > 0 ? ((avoidableCost / totalCost) * 100).toFixed(1) : 0}% of cloud spend can be safely reclaimed
          </div>
        </div>

        {/* Fleet Instances */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Fleet Capacity</span>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-slate-900 font-mono tracking-tight">
              {totalInstances}
            </span>
            <span className="text-xs text-slate-500 font-normal">active nodes</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Across {totalServices} monitored microservices
          </div>
        </div>

        {/* Health SLA */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>SLA Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-slate-900 font-mono tracking-tight">
              {healthyCount}/{totalServices}
            </span>
            <span className="text-xs text-slate-500 font-normal">healthy</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            100% latency SLA adherence
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="text-xs font-semibold text-slate-900">Optimization Opportunity Detected</div>
          <div className="text-xs text-slate-500 mt-0.5">
            CloudGuard identified idle compute capacity on background workers that can be scaled down safely.
          </div>
        </div>
        <button
          onClick={() =>
            onQuickRun(
              'Review the current services and reduce unnecessary cost without breaking the latency or availability requirements.'
            )
          }
          className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shrink-0 shadow-xs"
        >
          Run Optimization Investigation
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trend Chart */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Cloud Spend History
              </h2>
              <p className="text-xs text-slate-500">Hourly cost trajectory over time</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">USD / hr</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costHistory} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  stroke="#94a3b8"
                  tickFormatter={(val) =>
                    new Date(String(val)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '6px',
                    color: '#0f172a',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
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
                  fill="url(#costFill)"
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
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Fleet Capacity & CPU Utilization
              </h2>
              <p className="text-xs text-slate-500">Node provisioning vs fleet average CPU</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Instances / %</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={instanceHistory} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  stroke="#94a3b8"
                  tickFormatter={(val) =>
                    new Date(String(val)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '6px',
                    color: '#0f172a',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
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
                  stroke="#16a34a"
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
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Services Telemetry
              </h2>
              <p className="text-xs text-slate-500">Live compute metrics and provisioning</p>
            </div>
            <button
              onClick={() => onNavigateTab('services')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              All Services <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-slate-500 border-b border-slate-100 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Service</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">CPU</th>
                  <th className="py-2.5 px-3">Traffic</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Instances</th>
                  <th className="py-2.5 px-4 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {services.map((s) => (
                  <tr key={s.service_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-900 font-mono text-[11px]">
                      {s.service_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.healthy ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        <span className={s.healthy ? 'text-slate-700' : 'text-red-600 font-medium'}>
                          {s.healthy ? 'Healthy' : 'Degraded'}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{s.cpu_percent}%</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {s.requests_per_minute.toLocaleString()} RPM
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <span className={s.latency_ms > s.max_latency_ms ? 'text-red-600 font-bold' : ''}>
                        {s.latency_ms} ms
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {s.instances} <span className="text-slate-400">({s.min_instances}-{s.max_instances})</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900 text-right">
                      ${s.cost_per_hour.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Operations Feed (1 Col) */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4 flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Live Operations Feed
            </h2>
            <span className="text-[10px] font-mono text-slate-400">WebSocket</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[290px] space-y-2 pr-1 text-xs">
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
                    className="p-2.5 rounded-md bg-slate-50 border border-slate-100 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-slate-600 font-medium uppercase">
                        {evt.type.replace(/_/g, ' ')}
                      </span>
                      <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-800">{evt.message}</p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
