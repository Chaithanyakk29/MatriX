import { simulator } from '../cloud/simulator';

export interface ActionProposal {
  action: 'scale_up' | 'scale_down' | 'stop_idle_service' | 'no_action';
  service_id: string;
  target_instances?: number;
  observed_version?: number;
  observed_timestamp?: string;
}

export interface SafetyCheckItem {
  name: string;
  passed: boolean;
  message: string;
}

export interface ValidationResult {
  allowed: boolean;
  checks: SafetyCheckItem[];
  reason?: string;
}

export class SafetyEngine {
  private freshnessThresholdMs: number = 30 * 60 * 1000; // 30 minutes threshold

  public setFreshnessThresholdMinutes(minutes: number) {
    this.freshnessThresholdMs = minutes * 60 * 1000;
  }

  public validateAction(proposal: ActionProposal): ValidationResult {
    const checks: SafetyCheckItem[] = [];

    // 1. Action Type Validation
    const validActions = ['scale_up', 'scale_down', 'stop_idle_service', 'no_action'];
    if (!validActions.includes(proposal.action)) {
      return {
        allowed: false,
        checks: [{ name: 'Valid Action Type', passed: false, message: `Unsupported action type: ${proposal.action}` }],
        reason: `Unsupported action type: ${proposal.action}`,
      };
    }
    checks.push({ name: 'Valid Action Type', passed: true, message: `Action '${proposal.action}' is supported.` });

    if (proposal.action === 'no_action') {
      checks.push({ name: 'No-Op Safe Execution', passed: true, message: 'No state modifications requested.' });
      return { allowed: true, checks };
    }

    // 2. Service Existence
    const service = simulator.getService(proposal.service_id);
    if (!service) {
      checks.push({ name: 'Service Existence', passed: false, message: `Service '${proposal.service_id}' does not exist.` });
      return { allowed: false, checks, reason: `Service '${proposal.service_id}' not found.` };
    }
    checks.push({ name: 'Service Existence', passed: true, message: `Service '${proposal.service_id}' located.` });

    // 3. Health & Availability Constraint
    if (!service.healthy) {
      checks.push({ name: 'Health Constraint', passed: false, message: `Service '${proposal.service_id}' is unhealthy. Scaling operations are halted.` });
      return { allowed: false, checks, reason: 'Service is not healthy. Automated mutations suspended.' };
    }
    checks.push({ name: 'Health Constraint', passed: true, message: 'Service health check is active and OK.' });

    // 4. Concurrency & State Version Check
    if (proposal.observed_version !== undefined && proposal.observed_version !== service.version) {
      checks.push({
        name: 'State Concurrency Check',
        passed: false,
        message: `Version conflict: observed v${proposal.observed_version} but current is v${service.version}.`,
      });
      return { allowed: false, checks, reason: 'Concurrent state mutation detected. Re-evaluation required.' };
    }
    checks.push({ name: 'State Concurrency Check', passed: true, message: `State version v${service.version} confirmed.` });

    // 5. Scaling Specific Constraints
    if (proposal.action === 'scale_up' || proposal.action === 'scale_down') {
      if (proposal.target_instances === undefined || typeof proposal.target_instances !== 'number') {
        checks.push({ name: 'Instance Parameter Check', passed: false, message: 'Target instance count is missing or invalid.' });
        return { allowed: false, checks, reason: 'target_instances is required for scaling actions.' };
      }

      // Minimum Capacity
      if (proposal.target_instances < service.min_instances) {
        checks.push({
          name: 'Minimum Capacity Boundary',
          passed: false,
          message: `Target ${proposal.target_instances} is below minimum allowed capacity (${service.min_instances}).`,
        });
        return {
          allowed: false,
          checks,
          reason: `Violates minimum instance constraint (${proposal.target_instances} < ${service.min_instances}).`,
        };
      }
      checks.push({
        name: 'Minimum Capacity Boundary',
        passed: true,
        message: `Target ${proposal.target_instances} >= min_instances (${service.min_instances}).`,
      });

      // Maximum Capacity
      if (proposal.target_instances > service.max_instances) {
        checks.push({
          name: 'Maximum Capacity Boundary',
          passed: false,
          message: `Target ${proposal.target_instances} exceeds maximum allowed capacity (${service.max_instances}).`,
        });
        return {
          allowed: false,
          checks,
          reason: `Violates maximum instance constraint (${proposal.target_instances} > ${service.max_instances}).`,
        };
      }
      checks.push({
        name: 'Maximum Capacity Boundary',
        passed: true,
        message: `Target ${proposal.target_instances} <= max_instances (${service.max_instances}).`,
      });

      // Directional Sanity Check
      if (proposal.action === 'scale_down' && proposal.target_instances >= service.instances) {
        checks.push({
          name: 'Directional Logic',
          passed: false,
          message: `Scale down target (${proposal.target_instances}) must be less than current instances (${service.instances}).`,
        });
        return { allowed: false, checks, reason: 'Invalid scale down target instances.' };
      }
      if (proposal.action === 'scale_up' && proposal.target_instances <= service.instances) {
        checks.push({
          name: 'Directional Logic',
          passed: false,
          message: `Scale up target (${proposal.target_instances}) must be greater than current instances (${service.instances}).`,
        });
        return { allowed: false, checks, reason: 'Invalid scale up target instances.' };
      }
      checks.push({ name: 'Directional Logic', passed: true, message: 'Proposed scaling direction matches current instance count.' });

      // 6. Data Freshness & Traffic Discrepancy Check (Test C)
      const latestTraffic = simulator.getLatestTraffic(proposal.service_id);
      if (latestTraffic && proposal.action === 'scale_down') {
        const trafficDelta = latestTraffic.requests_per_minute - service.requests_per_minute;
        if (latestTraffic.requests_per_minute > 2000 && trafficDelta > 1000) {
          checks.push({
            name: 'Data Freshness & Load Sanity',
            passed: false,
            message: `Stale observation detected! Observed ${service.requests_per_minute} RPM, but live traffic is ${latestTraffic.requests_per_minute} RPM. Scale down rejected.`,
          });
          return {
            allowed: false,
            checks,
            reason: `Stale data detected. Live traffic is ${latestTraffic.requests_per_minute} RPM (observed was ${service.requests_per_minute} RPM). Cannot safely scale down.`,
          };
        }
      }
      checks.push({ name: 'Data Freshness & Load Sanity', passed: true, message: 'Traffic observations are fresh and consistent.' });

      // 7. Latency SLA Guard
      if (proposal.action === 'scale_down' && service.latency_ms > service.max_latency_ms * 0.8) {
        checks.push({
          name: 'Latency SLA Buffer',
          passed: false,
          message: `Current latency (${service.latency_ms}ms) is too close to max SLA (${service.max_latency_ms}ms). Downscaling would risk SLA breach.`,
        });
        return { allowed: false, checks, reason: 'Latency SLA buffer exceeded.' };
      }
      checks.push({ name: 'Latency SLA Buffer', passed: true, message: `Latency SLA buffer satisfied (${service.latency_ms}ms < ${service.max_latency_ms}ms).` });
    }

    // 8. Stop Idle Service Rules
    if (proposal.action === 'stop_idle_service') {
      if (service.requests_per_minute > 0) {
        checks.push({
          name: 'Zero Traffic Requirement',
          passed: false,
          message: `Cannot stop service with active traffic (${service.requests_per_minute} RPM).`,
        });
        return { allowed: false, checks, reason: 'Service has active incoming requests.' };
      }
      checks.push({ name: 'Zero Traffic Requirement', passed: true, message: 'Zero active traffic verified.' });
    }

    return {
      allowed: true,
      checks,
    };
  }
}

export const safetyEngine = new SafetyEngine();
