import React, { useState } from 'react';
import { Search, RefreshCw, Server, CheckCircle2, XCircle, AlertCircle, Boxes, Table } from 'lucide-react';
import { Service } from '../types';
import { api } from '../services/api';
import { GkePodTopology } from '../components/GkePodTopology';

interface ServicesPageProps {
  services: Service[];
  onRefresh: () => void;
  onLoadScenario?: (scenarioId: string) => Promise<void>;
  onResetScenarios?: () => Promise<void>;
  onNavigateToAgent?: (prompt: string) => void;
  activeScenarioId?: string;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  services,
  onRefresh,
  onLoadScenario,
  onResetScenarios,
  onNavigateToAgent,
  activeScenarioId = 'default',
}) => {
  const [viewMode, setViewMode] = useState<'topology' | 'table'>('topology');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHealth, setFilterHealth] = useState<'all' | 'healthy' | 'unhealthy'>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.service_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHealth =
      filterHealth === 'all' ? true : filterHealth === 'healthy' ? s.healthy : !s.healthy;
    return matchesSearch && matchesHealth;
  });

  const handleVerify = async (serviceId: string) => {
    setIsVerifying(true);
    try {
      const res = await api.verifyService(serviceId);
      setVerificationResult(res);
    } catch (e: any) {
      setVerificationResult({ status: 'error', message: e.message });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top View Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cloud Services & Infrastructure
            </h2>
            <p className="text-[11px] text-slate-500">Active microservices and instance replica distributions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('topology')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'topology'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Server</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            title="Refresh Fleet"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* View Mode: GKE Pod Topology */}
      {viewMode === 'topology' ? (
        <GkePodTopology
          services={services}
          onLoadScenario={onLoadScenario}
          onResetScenarios={onResetScenarios}
          onNavigateToAgent={onNavigateToAgent}
          activeScenarioId={activeScenarioId}
        />
      ) : (
        <>
          {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by service name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 shadow-2xs"
            />
          </div>

          <select
            value={filterHealth}
            onChange={(e: any) => setFilterHealth(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-md px-2.5 py-1.5 focus:outline-hidden focus:border-slate-400 shadow-2xs"
          >
            <option value="all">All Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="unhealthy">Degraded</option>
          </select>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-2xs transition-colors"
            title="Refresh Services"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing {filteredServices.length} of {services.length} services
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">CPU</th>
                <th className="py-2.5 px-3">Memory</th>
                <th className="py-2.5 px-3">Workload</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Instances</th>
                <th className="py-2.5 px-3">Hourly Cost</th>
                <th className="py-2.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No services match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredServices.map((s) => (
                  <tr key={s.service_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] font-semibold text-slate-900">
                        {s.service_id}
                      </div>
                      <div className="text-[10px] text-slate-400">{s.name || 'Cloud Service'}</div>
                    </td>
                    <td className="py-3 px-3">
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
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              s.cpu_percent > 80
                                ? 'bg-red-500'
                                : s.cpu_percent > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, s.cpu_percent)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-700">{s.cpu_percent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {s.memory_percent}%
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {s.requests_per_minute.toLocaleString()} RPM
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span className={s.latency_ms > s.max_latency_ms ? 'text-red-600 font-bold' : 'text-slate-700'}>
                        {s.latency_ms} ms
                      </span>
                      <span className="text-slate-400 text-[10px] ml-1">/ {s.max_latency_ms} ms</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                      {s.instances} <span className="text-slate-400">({s.min_instances} - {s.max_instances})</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-900 text-[11px]">
                      ${s.cost_per_hour.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedService(s);
                          setVerificationResult(null);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Detail Drawer / Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">{selectedService.service_id}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    v{selectedService.version}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">{selectedService.name || 'Cloud Service Specification'}</p>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-slate-500 text-[11px]">Instances</span>
                <p className="text-base font-semibold text-slate-900 mt-0.5 font-mono">{selectedService.instances}</p>
                <span className="text-[10px] text-slate-400">Min: {selectedService.min_instances} | Max: {selectedService.max_instances}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-slate-500 text-[11px]">Cost / Hour</span>
                <p className="text-base font-semibold text-slate-900 mt-0.5 font-mono">${selectedService.cost_per_hour.toFixed(2)}</p>
                <span className="text-[10px] text-slate-400">${selectedService.cost_per_instance_hour.toFixed(2)} / instance</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-slate-500 text-[11px]">Latency</span>
                <p
                  className={`text-base font-semibold mt-0.5 font-mono ${
                    selectedService.latency_ms > selectedService.max_latency_ms ? 'text-red-600 font-bold' : 'text-slate-900'
                  }`}
                >
                  {selectedService.latency_ms} ms
                </p>
                <span className="text-[10px] text-slate-400">SLA: ≤ {selectedService.max_latency_ms} ms</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-slate-500 text-[11px]">Traffic</span>
                <p className="text-base font-semibold text-slate-900 mt-0.5 font-mono">{selectedService.requests_per_minute} RPM</p>
                <span className="text-[10px] text-slate-400">CPU: {selectedService.cpu_percent}%</span>
              </div>
            </div>

            {/* SLA Verification Section */}
            <div className="p-4 bg-slate-50 rounded-md border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Deterministic SLA Verification</h4>
                  <p className="text-[11px] text-slate-500">Query the backend Safety Engine to test constraints against current state.</p>
                </div>
                <button
                  onClick={() => handleVerify(selectedService.service_id)}
                  disabled={isVerifying}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isVerifying ? 'Checking...' : 'Run SLA Check'}
                </button>
              </div>

              {verificationResult && (
                <div className="p-3 rounded bg-white border border-slate-200 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Result:</span>
                    <span
                      className={`font-semibold ${
                        verificationResult.status === 'passed' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {verificationResult.status?.toUpperCase()}
                    </span>
                  </div>
                  <pre className="text-[10px] text-slate-600 overflow-x-auto pt-1">
                    {JSON.stringify(verificationResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedService(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
