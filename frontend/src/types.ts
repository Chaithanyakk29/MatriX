export interface Service {
  service_id: string;
  name?: string;
  cpu_percent: number;
  memory_percent: number;
  requests_per_minute: number;
  previous_requests_per_minute?: number;
  latency_ms: number;
  instances: number;
  cost_per_instance_hour: number;
  cost_per_hour: number;
  min_instances: number;
  max_instances: number;
  max_latency_ms: number;
  healthy: boolean;
  timestamp: string;
  version: number;
}

export interface CloudSummary {
  totalCostPerHour: number;
  totalInstances: number;
  activeServices: number;
  healthyServices: number;
  avoidableCostPerHour: number;
  activeScenario: string;
  timestamp: string;
}

export interface CostHistoryPoint {
  timestamp: string;
  totalCostPerHour: number;
  avoidableCost: number;
}

export interface InstanceHistoryPoint {
  timestamp: string;
  totalInstances: number;
  averageCpuPercent: number;
}

export interface ActionRecord {
  actionId: string;
  serviceId: string;
  action: 'scale_up' | 'scale_down' | 'stop_idle_service' | 'no_action';
  previousInstances: number;
  requestedInstances: number;
  finalInstances: number;
  status: 'success' | 'failed' | 'rejected';
  reason?: string;
  safetyChecks: { name: string; passed: boolean; message: string }[];
  verification: {
    status: 'passed' | 'failed' | 'not_run';
    actualInstances?: number;
    latencyMs?: number;
    healthy?: boolean;
    costPerHour?: number;
    message?: string;
  };
  estimatedSavingsPerHour: number;
  timestamp: string;
}

export interface AgentFinalReport {
  summary: string;
  problem: {
    service: string;
    reason: string;
  };
  decision: {
    action: string;
    from_instances: number;
    to_instances: number;
  };
  safety: {
    status: 'passed' | 'rejected';
    checks: string[];
  };
  execution: {
    status: 'success' | 'failed' | 'skipped';
    error?: string;
  };
  verification: {
    status: 'passed' | 'failed' | 'not_run';
    actual_instances?: number;
    latency_ms?: number;
  };
  estimated_savings_per_hour: number;
  mode: 'ollama' | 'deterministic';
  runId: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
}

export interface SystemStatus {
  system: string;
  database: {
    connected: boolean;
    type: 'mongodb' | 'in-memory';
    uri?: string;
    error?: string;
  };
  aiProvider: {
    provider: string;
    status: string;
    activeMode: string;
    model: string;
  };
  environment: string;
  timestamp: string;
}

export interface WsEvent {
  runId?: string;
  eventId: string;
  type: string;
  timestamp: string;
  message: string;
  data?: any;
}
