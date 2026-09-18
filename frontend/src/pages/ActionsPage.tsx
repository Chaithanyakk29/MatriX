import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock, Shield } from 'lucide-react';
import { ActionRecord } from '../types';
import { api } from '../services/api';

interface ActionsPageProps {
  actions: ActionRecord[];
  onRefresh: () => void;
}

export const ActionsPage: React.FC<ActionsPageProps> = ({ actions, onRefresh }) => {
  const [selectedAction, setSelectedAction] = useState<ActionRecord | null>(null);
  const [revalidateInfo, setRevalidateInfo] = useState<any>(null);
  const [liveVerification, setLiveVerification] = useState<any>(null);

  const handleRevalidate = async (actionId: string) => {
    try {
      const res = await api.revalidateAction(actionId);
      setRevalidateInfo(res);
    } catch (e: any) {
      setRevalidateInfo({ error: e.message });
    }
  };

  const handleCheckVerification = async (actionId: string) => {
    try {
      const res = await api.getActionVerification(actionId);
      setLiveVerification(res);
    } catch (e: any) {
      setLiveVerification({ error: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 font-mono">
          Showing {actions.length} historical action records
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Action ID</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Instances (Prev → Req → Final)</th>
                <th className="py-2.5 px-3">Safety Gate</th>
                <th className="py-2.5 px-3">Execution</th>
                <th className="py-2.5 px-3">SLA Verify</th>
                <th className="py-2.5 px-3">Savings/Hr</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400">
                    <Clock className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    No scaling actions executed yet.
                  </td>
                </tr>
              ) : (
                actions.map((act) => (
                  <tr key={act.actionId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-900 font-semibold">
                      {act.actionId}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-900 text-[11px]">
                      {act.serviceId}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-medium">
                        {act.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {act.previousInstances} → {act.requestedInstances} →{' '}
                      <span className="font-semibold text-slate-900">{act.finalInstances}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            act.status !== 'rejected' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        <span className={act.status !== 'rejected' ? 'text-slate-700' : 'text-red-600'}>
                          {act.status !== 'rejected' ? 'Passed' : 'Rejected'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span
                        className={
                          act.status === 'success'
                            ? 'text-emerald-600 font-medium'
                            : act.status === 'rejected'
                            ? 'text-amber-600 font-medium'
                            : 'text-red-600 font-medium'
                        }
                      >
                        {act.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span
                        className={
                          act.verification?.status === 'passed'
                            ? 'text-emerald-600'
                            : act.verification?.status === 'failed'
                            ? 'text-red-600'
                            : 'text-slate-400'
                        }
                      >
                        {act.verification?.status?.toUpperCase() || 'NOT_RUN'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900 font-medium">
                      {act.estimatedSavingsPerHour > 0
                        ? `+$${act.estimatedSavingsPerHour.toFixed(2)}`
                        : '$0.00'}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedAction(act);
                          setRevalidateInfo(null);
                          setLiveVerification(null);
                        }}
                        className="px-2.5 py-1 text-[11px] rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs font-medium"
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

      {/* Action Details Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-6 space-y-4 shadow-xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  {selectedAction.actionId}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedAction.serviceId} Mutation Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="p-1 text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100 space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">
                  Reasoning / Execution Status:
                </span>
                <p className="text-slate-800">{selectedAction.reason || 'None provided'}</p>
              </div>

              {selectedAction.safetyChecks && selectedAction.safetyChecks.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100 space-y-1.5">
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">
                    Safety Checks Enforced:
                  </span>
                  <div className="space-y-1 pt-0.5">
                    {selectedAction.safetyChecks.map((chk, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        {chk.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        )}
                        <span className="text-slate-700 font-mono">
                          {chk.name}: {chk.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Operations */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleRevalidate(selectedAction.actionId)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium"
                >
                  Revalidate with Safety Engine
                </button>
                <button
                  onClick={() => handleCheckVerification(selectedAction.actionId)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium border border-slate-200"
                >
                  Compare Live State
                </button>
              </div>

              {revalidateInfo && (
                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 font-mono text-[10px]">
                  <span className="text-slate-500 block mb-1 font-semibold">
                    Safety Engine Validation Output:
                  </span>
                  <pre className="text-slate-700">{JSON.stringify(revalidateInfo, null, 2)}</pre>
                </div>
              )}

              {liveVerification && (
                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 font-mono text-[10px]">
                  <span className="text-slate-500 block mb-1 font-semibold">
                    Live Telemetry Comparison:
                  </span>
                  <pre className="text-slate-700">{JSON.stringify(liveVerification, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAction(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md text-xs hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
