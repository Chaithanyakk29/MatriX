import fs from 'fs';
import path from 'path';
import { AuditRepository } from '../models/records';

export interface ServiceData {
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

export interface MetricSnapshot {
  timestamp: string;
  totalCostPerHour: number;
  totalInstances: number;
  averageCpuPercent: number;
  services: { service_id: string; instances: number; cost_per_hour: number; cpu_percent: number }[];
}

export class CloudSimulator {
  private services: ServiceData[] = [];
  private history: MetricSnapshot[] = [];
  private activeScenario: string = 'default';
  private scenariosDir = path.join(__dirname, '../../data/scenarios');
  private freshTrafficStore: Record<string, { rpm: number; timestamp: string }> = {};

  constructor() {
    this.initDefaultData();
  }

  public initDefaultData() {
    this.loadScenario('default');
    this.seedHistory();
  }

  private seedHistory() {
    const now = Date.now();
    this.history = [];
    // Generate 10 historic data points
    for (let i = 9; i >= 0; i--) {
      const pointTime = new Date(now - i * 5 * 60 * 1000).toISOString();
      const totalCost = this.services.reduce((acc, s) => acc + s.cost_per_hour, 0);
      const totalInstances = this.services.reduce((acc, s) => acc + s.instances, 0);
      const avgCpu = Math.round(this.services.reduce((acc, s) => acc + s.cpu_percent, 0) / (this.services.length || 1));

      this.history.push({
        timestamp: pointTime,
        totalCostPerHour: parseFloat(totalCost.toFixed(2)),
        totalInstances,
        averageCpuPercent: avgCpu,
        services: this.services.map(s => ({
          service_id: s.service_id,
          instances: s.instances,
          cost_per_hour: s.cost_per_hour,
          cpu_percent: s.cpu_percent,
        })),
      });
    }
  }

  public recordSnapshot() {
    const totalCost = this.services.reduce((acc, s) => acc + s.cost_per_hour, 0);
    const totalInstances = this.services.reduce((acc, s) => acc + s.instances, 0);
    const avgCpu = Math.round(this.services.reduce((acc, s) => acc + s.cpu_percent, 0) / (this.services.length || 1));

    this.history.push({
      timestamp: new Date().toISOString(),
      totalCostPerHour: parseFloat(totalCost.toFixed(2)),
      totalInstances,
      averageCpuPercent: avgCpu,
      services: this.services.map(s => ({
        service_id: s.service_id,
        instances: s.instances,
        cost_per_hour: s.cost_per_hour,
        cpu_percent: s.cpu_percent,
      })),
    });

    if (this.history.length > 50) this.history.shift();
  }

  public getAllServices(): ServiceData[] {
    return this.services;
  }

  public getService(serviceId: string): ServiceData | undefined {
    if (!serviceId) return undefined;
    const clean = serviceId.trim().toLowerCase();

    // 1. Exact match
    const exact = this.services.find(s => s.service_id.toLowerCase() === clean);
    if (exact) return exact;

    // 2. Normalized match (strip -api, -service, -worker, -gateway, backend)
    const norm = (str: string) => str.replace(/[-_]?(api|service|worker|gateway|backend)$/i, '').replace(/[-_]/g, '');
    const normClean = norm(clean);
    const normMatch = this.services.find(s => norm(s.service_id) === normClean);
    if (normMatch) return normMatch;

    // 3. Substring match
    const sub = this.services.find(s => s.service_id.toLowerCase().includes(clean) || clean.includes(s.service_id.toLowerCase()));
    if (sub) return sub;

    // 4. Human-readable name match
    const nameMatch = this.services.find(s => s.name && s.name.toLowerCase().includes(clean));
    if (nameMatch) return nameMatch;

    return undefined;
  }

  public getServiceMetrics(serviceId: string) {
    const s = this.getService(serviceId);
    if (!s) return null;
    return {
      service_id: s.service_id,
      cpu_percent: s.cpu_percent,
      memory_percent: s.memory_percent,
      requests_per_minute: s.requests_per_minute,
      latency_ms: s.latency_ms,
      healthy: s.healthy,
      timestamp: s.timestamp,
      version: s.version,
    };
  }

  public getServiceCost(serviceId: string) {
    const s = this.getService(serviceId);
    if (!s) return null;
    return {
      service_id: s.service_id,
      instances: s.instances,
      cost_per_instance_hour: s.cost_per_instance_hour,
      cost_per_hour: s.cost_per_hour,
      currency: 'USD',
    };
  }

  public setFreshTraffic(serviceId: string, rpm: number) {
    const s = this.getService(serviceId);
    const canonicalId = s ? s.service_id : serviceId;
    this.freshTrafficStore[canonicalId] = {
      rpm,
      timestamp: new Date().toISOString(),
    };
  }

  public getLatestTraffic(serviceId: string): { requests_per_minute: number; timestamp: string; is_live: boolean } | undefined {
    const s = this.getService(serviceId);
    const canonicalId = s ? s.service_id : serviceId;

    if (this.freshTrafficStore[canonicalId]) {
      return {
        requests_per_minute: this.freshTrafficStore[canonicalId].rpm,
        timestamp: this.freshTrafficStore[canonicalId].timestamp,
        is_live: true,
      };
    }

    // Default simulation freshness test for checkout-api (Test C)
    if (canonicalId === 'checkout-api' || canonicalId === 'checkout-service' || canonicalId === 'checkout') {
      return {
        requests_per_minute: 5200,
        timestamp: new Date().toISOString(),
        is_live: true,
      };
    }

    if (!s) return undefined;

    return {
      requests_per_minute: s.requests_per_minute,
      timestamp: s.timestamp,
      is_live: false,
    };
  }

  public applyScale(serviceId: string, targetInstances: number): { previousInstances: number; finalInstances: number } {
    const s = this.getService(serviceId);
    if (!s) {
      throw new Error(`Service ${serviceId} not found`);
    }

    // Simulated cloud capacity failure constraint for payment-api (Test D)
    if (s.service_id === 'payment-api' && targetInstances > 4) {
      AuditRepository.saveEvent({
        eventId: `evt-${Date.now()}`,
        serviceId: s.service_id,
        type: 'CAPACITY_UNAVAILABLE',
        severity: 'error',
        message: `Cloud provider rejected scale to ${targetInstances} instances: capacity unavailable in cluster region us-east-1.`,
        timestamp: new Date().toISOString(),
      });
      throw new Error('capacity_unavailable');
    }

    const prevInstances = s.instances;
    s.instances = targetInstances;
    s.cost_per_hour = parseFloat((s.cost_per_instance_hour * targetInstances).toFixed(2));

    // Dynamic metrics reaction to scaling
    if (targetInstances > prevInstances) {
      s.cpu_percent = Math.max(8, Math.round(s.cpu_percent * (prevInstances / targetInstances)));
      s.latency_ms = Math.max(15, Math.round(s.latency_ms * 0.65));
    } else if (targetInstances < prevInstances) {
      s.cpu_percent = Math.min(95, Math.round(s.cpu_percent * (prevInstances / targetInstances)));
      s.latency_ms = Math.min(s.max_latency_ms + 10, Math.round(s.latency_ms * 1.3));
    }

    s.version += 1;
    s.timestamp = new Date().toISOString();

    AuditRepository.saveEvent({
      eventId: `evt-${Date.now()}`,
      serviceId,
      type: 'SCALE_EVENT',
      severity: 'info',
      message: `Scaled service ${serviceId} from ${prevInstances} to ${targetInstances} instances. New cost: $${s.cost_per_hour}/hr.`,
      timestamp: s.timestamp,
    });

    this.recordSnapshot();
    return { previousInstances: prevInstances, finalInstances: targetInstances };
  }

  public stopService(serviceId: string): boolean {
    const s = this.getService(serviceId);
    if (!s) return false;
    if (s.requests_per_minute > 0) {
      throw new Error('cannot_stop_active_service');
    }
    s.instances = 0;
    s.cost_per_hour = 0;
    s.version += 1;
    s.timestamp = new Date().toISOString();
    this.recordSnapshot();
    return true;
  }

  public verifyService(serviceId: string) {
    const s = this.getService(serviceId);
    if (!s) return { status: 'failed', message: 'Service not found' };

    const withinLatency = s.latency_ms <= s.max_latency_ms;
    const withinBounds = s.instances >= s.min_instances && s.instances <= s.max_instances;
    const healthy = s.healthy;

    const passed = withinLatency && withinBounds && healthy;

    return {
      status: passed ? 'passed' : 'failed',
      service_id: s.service_id,
      actual_instances: s.instances,
      cpu_percent: s.cpu_percent,
      latency_ms: s.latency_ms,
      cost_per_hour: s.cost_per_hour,
      healthy: s.healthy,
      version: s.version,
      within_latency_sla: withinLatency,
      within_capacity_bounds: withinBounds,
    };
  }

  public getCloudSummary() {
    const totalCostPerHour = parseFloat(this.services.reduce((acc, s) => acc + s.cost_per_hour, 0).toFixed(2));
    const totalInstances = this.services.reduce((acc, s) => acc + s.instances, 0);
    const activeServices = this.services.length;
    const healthyServices = this.services.filter(s => s.healthy).length;

    // Calculate potential avoidable cost (e.g. idle capacity in reports-worker or overprovisioned services)
    let avoidableCostPerHour = 0;
    for (const s of this.services) {
      if (s.requests_per_minute === 0 && s.instances > s.min_instances) {
        avoidableCostPerHour += (s.instances - s.min_instances) * s.cost_per_instance_hour;
      }
    }

    return {
      totalCostPerHour,
      totalInstances,
      activeServices,
      healthyServices,
      avoidableCostPerHour: parseFloat(avoidableCostPerHour.toFixed(2)),
      activeScenario: this.activeScenario,
      timestamp: new Date().toISOString(),
    };
  }

  public getCostHistory() {
    return this.history.map(h => ({
      timestamp: h.timestamp,
      totalCostPerHour: h.totalCostPerHour,
      avoidableCost: parseFloat((h.totalCostPerHour * 0.22).toFixed(2)),
    }));
  }

  public getInstanceHistory() {
    return this.history.map(h => ({
      timestamp: h.timestamp,
      totalInstances: h.totalInstances,
      averageCpuPercent: h.averageCpuPercent,
    }));
  }

  public loadScenario(scenarioId: string): boolean {
    try {
      const normMap: Record<string, string> = {
        'test-a': 'testA', 'testa': 'testA', 'testa.json': 'testA',
        'test-b': 'testB', 'testb': 'testB', 'testb.json': 'testB',
        'test-c': 'testC', 'testc': 'testC', 'testc.json': 'testC',
        'test-d': 'testD', 'testd': 'testD', 'testd.json': 'testD',
      };
      const canonicalId = normMap[scenarioId.toLowerCase()] || scenarioId;
      const fileName = canonicalId.endsWith('.json') ? canonicalId : `${canonicalId}.json`;
      const filePath = path.join(this.scenariosDir, fileName);

      if (!fs.existsSync(filePath)) {
        return false;
      }

      const fileData = fs.readFileSync(filePath, 'utf-8');
      const loaded: ServiceData[] = JSON.parse(fileData);

      // Normalize fields if needed
      const isTestC = canonicalId.toLowerCase().includes('testc') || canonicalId.toLowerCase().includes('test-c');
      this.services = loaded.map(s => {
        let ts = new Date().toISOString();
        if (isTestC && (s.service_id === 'checkout-api' || s.service_id === 'checkout')) {
          // Explicitly simulate 30-minute-old stale telemetry for Test C
          ts = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        }
        return {
          ...s,
          cost_per_instance_hour: s.cost_per_instance_hour || parseFloat((s.cost_per_hour / (s.instances || 1)).toFixed(4)),
          version: s.version || 1,
          timestamp: ts,
        };
      });

      this.activeScenario = scenarioId;
      this.recordSnapshot();

      AuditRepository.saveEvent({
        eventId: `evt-${Date.now()}`,
        type: 'SCENARIO_LOADED',
        severity: 'info',
        message: `Cloud scenario '${scenarioId}' successfully loaded with ${this.services.length} services.`,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (e: any) {
      console.error(`Failed to load scenario ${scenarioId}:`, e.message);
      return false;
    }
  }

  public resetToDefault(): boolean {
    return this.loadScenario('default');
  }

  public getAvailableScenarios() {
    return [
      {
        id: 'default',
        name: 'Standard Baseline Cloud',
        description: 'Standard multi-service cloud environment with orders, reports, checkout, payment, and auth services.',
      },
      {
        id: 'testA',
        name: 'Test A — Idle Reports Worker',
        description: 'reports-worker is idle (0 RPM, 9% CPU, 4 instances). Prime candidate for scaling down from 4 to 1 to save $33/hr.',
      },
      {
        id: 'testB',
        name: 'Test B — Orders Traffic Surge',
        description: 'orders-api traffic doubled (2100 -> 4200 RPM, 260ms latency close to 300ms SLA). Requires scale up to 5 instances.',
      },
      {
        id: 'testC',
        name: 'Test C — Stale Metrics Detection',
        description: 'checkout-api reports old metric of 900 RPM, but live traffic is 5200 RPM. Agent must detect stale data and refuse scale down.',
      },
      {
        id: 'testD',
        name: 'Test D — Capacity Unavailable Failure',
        description: 'payment-api is at 91% CPU and 410ms latency. Proposing scale up to 5 triggers capacity_unavailable simulation error.',
      },
    ];
  }
}

export const simulator = new CloudSimulator();
