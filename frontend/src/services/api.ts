import axios from 'axios';
import { Service, CloudSummary, CostHistoryPoint, InstanceHistoryPoint, ActionRecord, AgentFinalReport, Scenario, SystemStatus } from '../types';

const API_BASE = 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Services
  getServices: async (): Promise<Service[]> => {
    const res = await client.get('/services');
    return res.data.data;
  },

  getService: async (serviceId: string): Promise<Service> => {
    const res = await client.get(`/services/${serviceId}`);
    return res.data.data;
  },

  verifyService: async (serviceId: string) => {
    const res = await client.get(`/services/${serviceId}/verify`);
    return res.data.data;
  },

  // Cloud Summary & Analytics
  getCloudSummary: async (): Promise<CloudSummary> => {
    const res = await client.get('/cloud/summary');
    return res.data.data;
  },

  getCostHistory: async (): Promise<CostHistoryPoint[]> => {
    const res = await client.get('/cloud/cost-history');
    return res.data.data;
  },

  getInstanceHistory: async (): Promise<InstanceHistoryPoint[]> => {
    const res = await client.get('/cloud/instance-history');
    return res.data.data;
  },

  // Agent
  runAgent: async (prompt: string): Promise<AgentFinalReport> => {
    const res = await client.post('/agent/run', { prompt });
    return res.data.data;
  },

  getAgentRuns: async () => {
    const res = await client.get('/agent/runs');
    return res.data.data;
  },

  // Actions Audit
  getActions: async (): Promise<ActionRecord[]> => {
    const res = await client.get('/actions');
    return res.data.data;
  },

  revalidateAction: async (actionId: string) => {
    const res = await client.post(`/actions/${actionId}/revalidate`);
    return res.data.data;
  },

  getActionVerification: async (actionId: string) => {
    const res = await client.get(`/actions/${actionId}/verification`);
    return res.data.data;
  },

  // Scenarios
  getScenarios: async (): Promise<Scenario[]> => {
    const res = await client.get('/scenarios');
    return res.data.data;
  },

  loadScenario: async (scenarioId: string) => {
    const res = await client.post(`/scenarios/${scenarioId}/load`);
    return res.data.data;
  },

  resetScenarios: async () => {
    const res = await client.post('/scenarios/reset');
    return res.data.data;
  },

  // System & Diagnostics
  getSystemStatus: async (): Promise<SystemStatus> => {
    const res = await client.get('/system/status');
    return res.data.data;
  },

  setDemoMode: async (enabled: boolean) => {
    const res = await client.post('/config/demo-mode', { enabled });
    return res.data.data;
  },

  // Nodemailer Alerts
  getAlertHistory: async (): Promise<any[]> => {
    const res = await client.get('/alerts/history');
    return res.data.data;
  },

  sendTestAlert: async (data?: any): Promise<any> => {
    const res = await client.post('/alerts/test', data || {});
    return res.data.data;
  },
};
