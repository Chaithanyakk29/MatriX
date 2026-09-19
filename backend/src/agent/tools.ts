import { simulator } from '../cloud/simulator';
import { safetyEngine, ActionProposal } from '../safety/safetyEngine';
import { broadcastEvent } from '../websocket/server';
import { AuditRepository, IActionRecord } from '../models/records';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export const toolDefinitions: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_all_services',
      description: 'Retrieve a list of all currently running cloud services with their metrics, instance counts, and health status.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_service',
      description: 'Get detailed configuration and state for a specific service.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'Unique identifier of the service' },
        },
        required: ['service_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_service_metrics',
      description: 'Retrieve CPU, memory, requests per minute, and latency metrics for a service.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'Service identifier' },
        },
        required: ['service_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_latest_traffic',
      description: 'Fetch the latest real-time traffic observations to guard against stale metrics.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'Service identifier' },
        },
        required: ['service_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_events',
      description: 'Retrieve recent system and infrastructure events for a given service or all services.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'Optional service identifier' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_service_cost',
      description: 'Retrieve detailed cost breakdown and pricing for a service.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'Service identifier' },
        },
        required: ['service_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_cloud_summary',
      description: 'Get overall aggregate cloud statistics including total hourly cost, instance counts, and potential avoidable spend.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_action',
      description: 'Validate a proposed optimization action with the deterministic Safety Engine without executing it.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['scale_up', 'scale_down', 'stop_idle_service', 'no_action'] },
          service_id: { type: 'string' },
          target_instances: { type: 'number' },
          observed_version: { type: 'number', description: 'Observed cluster version for concurrency safety' },
          observed_timestamp: { type: 'string', description: 'ISO timestamp when telemetry was observed for freshness validation' },
        },
        required: ['action', 'service_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scale_service',
      description: 'Safely execute a scaling action on a service. Always passes through the Safety Engine first.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string' },
          target_instances: { type: 'number' },
          reason: { type: 'string', description: 'Clear reason for scaling' },
          observed_version: { type: 'number', description: 'Observed cluster version for concurrency safety' },
          observed_timestamp: { type: 'string', description: 'ISO timestamp when telemetry was observed for freshness validation' },
        },
        required: ['service_id', 'target_instances'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'stop_service',
      description: 'Stop an idle service with zero incoming traffic to save costs.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['service_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resize_service',
      description: 'Vertically rightsize an instance flavor (e.g. e2-standard-4 to e2-standard-2) to reduce unit hourly cost without touching replica counts.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'Service identifier' },
          instance_type: { type: 'string', description: 'Target VM flavor: e2-micro, e2-small, e2-medium, e2-standard-2, e2-standard-4' },
          reason: { type: 'string', description: 'Justification for resizing' },
        },
        required: ['service_id', 'instance_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delay_batch_workload',
      description: 'Defer non-critical overnight batch workloads (e.g. reports-worker) to off-peak hours, dropping compute spend by 70%.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'Batch worker service identifier' },
          reason: { type: 'string', description: 'Justification for deferring workload' },
        },
        required: ['service_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'verify_service',
      description: 'Fetch the post-action state of a service to verify whether the executed change succeeded and meets SLAs.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string' },
        },
        required: ['service_id'],
      },
    },
  },
];

export async function executeTool(name: string, args: any, runId?: string): Promise<any> {
  broadcastEvent('tool_called', `Agent invoking tool: ${name}`, { tool: name, args }, runId);

  switch (name) {
    case 'get_all_services': {
      const services = simulator.getAllServices();
      broadcastEvent('metric_fetched', `Retrieved ${services.length} services`, { count: services.length }, runId);
      return services;
    }

    case 'get_service': {
      const service = simulator.getService(args.service_id);
      if (!service) {
        const all = simulator.getAllServices().map(s => s.service_id).join(', ');
        return { error: `Service '${args.service_id}' not found. Available services: ${all}` };
      }
      return service;
    }

    case 'get_service_metrics': {
      const service = simulator.getService(args.service_id);
      if (!service) {
        const all = simulator.getAllServices().map(s => s.service_id).join(', ');
        return { error: `Service '${args.service_id}' not found. Available services: ${all}` };
      }
      const metrics = simulator.getServiceMetrics(service.service_id);
      broadcastEvent('metric_fetched', `Fetched metrics for ${service.service_id}: CPU ${metrics?.cpu_percent}%, ${metrics?.requests_per_minute} RPM`, metrics, runId);
      return metrics;
    }

    case 'get_latest_traffic': {
      const service = simulator.getService(args.service_id);
      const targetId = service ? service.service_id : args.service_id;
      const traffic = simulator.getLatestTraffic(targetId);
      if (!traffic) return { error: `Service '${args.service_id}' not found` };
      broadcastEvent('metric_fetched', `Live traffic for ${targetId}: ${traffic.requests_per_minute} RPM`, traffic, runId);
      return traffic;
    }

    case 'get_recent_events': {
      const service = args.service_id ? simulator.getService(args.service_id) : undefined;
      const targetId = service ? service.service_id : args.service_id;
      if (targetId) {
        return await AuditRepository.getEventsByService(targetId);
      }
      return await AuditRepository.getAllEvents();
    }

    case 'get_service_cost': {
      const service = simulator.getService(args.service_id);
      if (!service) return { error: `Service '${args.service_id}' not found` };
      return simulator.getServiceCost(service.service_id);
    }

    case 'get_current_cloud_summary': {
      return simulator.getCloudSummary();
    }

    case 'validate_action': {
      const service = simulator.getService(args.service_id);
      const targetId = service ? service.service_id : args.service_id;
      broadcastEvent('safety_check_started', `Validating action ${args.action} on ${targetId}`, args, runId);
      const validation = safetyEngine.validateAction({
        action: args.action,
        service_id: targetId,
        target_instances: args.target_instances,
        observed_version: args.observed_version ?? service?.version,
        observed_timestamp: args.observed_timestamp ?? service?.timestamp,
      });

      if (validation.allowed) {
        broadcastEvent('safety_check_passed', `Safety checks passed for ${targetId}`, validation, runId);
      } else {
        broadcastEvent('safety_check_failed', `Safety check rejected: ${validation.reason}`, validation, runId);
      }
      return validation;
    }

    case 'scale_service': {
      const service = simulator.getService(args.service_id);
      if (!service) {
        const all = simulator.getAllServices().map(s => s.service_id).join(', ');
        return { error: `Service '${args.service_id}' not found. Available services: ${all}` };
      }

      const canonicalId = service.service_id;
      const targetInstances = Number(args.target_instances);
      const actionType = targetInstances > service.instances ? 'scale_up' : 'scale_down';
      const actionProposal: ActionProposal = {
        action: actionType,
        service_id: canonicalId,
        target_instances: targetInstances,
        observed_version: args.observed_version ?? service.version,
        observed_timestamp: args.observed_timestamp ?? service.timestamp,
      };

      broadcastEvent('safety_check_started', `Validating ${actionType} from ${service.instances} -> ${targetInstances} on ${canonicalId}`, actionProposal, runId);
      const validation = safetyEngine.validateAction(actionProposal);

      const actionId = `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const prevInstances = service.instances;

      if (!validation.allowed) {
        broadcastEvent('safety_check_failed', `Safety check rejected action: ${validation.reason}`, validation, runId);
        const record: IActionRecord = {
          actionId,
          serviceId: canonicalId,
          action: actionType,
          previousInstances: prevInstances,
          requestedInstances: targetInstances,
          finalInstances: prevInstances,
          status: 'rejected',
          reason: validation.reason,
          safetyChecks: validation.checks,
          verification: { status: 'not_run' },
          estimatedSavingsPerHour: 0,
          timestamp: new Date().toISOString(),
        };
        await AuditRepository.saveAction(record);
        return { status: 'rejected', reason: validation.reason, checks: validation.checks };
      }

      broadcastEvent('safety_check_passed', `Safety checks approved scaling ${canonicalId}`, validation, runId);
      broadcastEvent('action_started', `Executing ${actionType} ${prevInstances} -> ${targetInstances}`, { service_id: canonicalId, target: targetInstances }, runId);

      try {
        const result = simulator.applyScale(canonicalId, targetInstances);
        const updatedService = simulator.getService(canonicalId);
        const newCost = updatedService?.cost_per_hour || 0;
        const savings = Math.max(0, parseFloat(((prevInstances - targetInstances) * service.cost_per_instance_hour).toFixed(2)));

        broadcastEvent('action_succeeded', `Successfully scaled ${canonicalId} to ${targetInstances} instances`, { ...result, newCost }, runId);

        // Verification step
        broadcastEvent('verification_started', `Initiating post-action verification on ${canonicalId}`, {}, runId);
        const verification = simulator.verifyService(canonicalId);

        if (verification.status === 'passed') {
          broadcastEvent('verification_succeeded', `Post-action verification verified state: ${verification.actual_instances} instances, ${verification.latency_ms}ms latency`, verification, runId);
        } else {
          broadcastEvent('verification_failed', `Post-action verification failed SLA requirements`, verification, runId);
        }

        const record: IActionRecord = {
          actionId,
          serviceId: canonicalId,
          action: actionType,
          previousInstances: prevInstances,
          requestedInstances: targetInstances,
          finalInstances: result.finalInstances,
          status: 'success',
          reason: args.reason || 'Optimized by CloudGuard AI',
          safetyChecks: validation.checks,
          verification: {
            status: verification.status as any,
            actualInstances: verification.actual_instances,
            latencyMs: verification.latency_ms,
            healthy: verification.healthy,
            costPerHour: verification.cost_per_hour,
          },
          estimatedSavingsPerHour: savings,
          timestamp: new Date().toISOString(),
        };
        await AuditRepository.saveAction(record);

        return {
          status: 'success',
          actionId,
          service_id: canonicalId,
          previousInstances: prevInstances,
          finalInstances: result.finalInstances,
          verification,
          estimatedSavingsPerHour: savings,
        };
      } catch (err: any) {
        broadcastEvent('action_failed', `Action execution failed: ${err.message}`, { error: err.message }, runId);
        const record: IActionRecord = {
          actionId,
          serviceId: canonicalId,
          action: actionType,
          previousInstances: prevInstances,
          requestedInstances: targetInstances,
          finalInstances: prevInstances,
          status: 'failed',
          reason: err.message,
          safetyChecks: validation.checks,
          verification: { status: 'failed', message: err.message },
          estimatedSavingsPerHour: 0,
          timestamp: new Date().toISOString(),
        };
        await AuditRepository.saveAction(record);
        return { status: 'failed', error: err.message };
      }
    }

    case 'stop_service': {
      const service = simulator.getService(args.service_id);
      if (!service) return { error: `Service ${args.service_id} not found` };
      const canonicalId = service.service_id;

      const validation = safetyEngine.validateAction({
        action: 'stop_idle_service',
        service_id: canonicalId,
      });

      if (!validation.allowed) {
        return { status: 'rejected', reason: validation.reason, checks: validation.checks };
      }

      try {
        simulator.stopService(canonicalId);
        return { status: 'success', service_id: canonicalId, instances: 0 };
      } catch (e: any) {
        return { status: 'failed', error: e.message };
      }
    }

    case 'resize_service': {
      const service = simulator.getService(args.service_id);
      if (!service) return { error: `Service ${args.service_id} not found` };
      const canonicalId = service.service_id;

      const validation = safetyEngine.validateAction({
        action: 'resize',
        service_id: canonicalId,
        instance_type: args.instance_type,
      });

      if (!validation.allowed) {
        return { status: 'rejected', reason: validation.reason, checks: validation.checks };
      }

      try {
        const resizeRes = simulator.applyResize(canonicalId, args.instance_type || 'e2-standard-2');
        broadcastEvent('action_succeeded', `Vertically rightsized ${canonicalId} to ${resizeRes.finalType}`, resizeRes, runId);
        return { status: 'success', service_id: canonicalId, ...resizeRes };
      } catch (e: any) {
        return { status: 'failed', error: e.message };
      }
    }

    case 'delay_batch_workload': {
      const service = simulator.getService(args.service_id);
      if (!service) return { error: `Service ${args.service_id} not found` };
      const canonicalId = service.service_id;

      const validation = safetyEngine.validateAction({
        action: 'delay_batch_workload',
        service_id: canonicalId,
      });

      if (!validation.allowed) {
        return { status: 'rejected', reason: validation.reason, checks: validation.checks };
      }

      try {
        const delayRes = simulator.delayBatchWorkload(canonicalId);
        broadcastEvent('action_succeeded', `Deferred batch workload on ${canonicalId} to off-peak window`, delayRes, runId);
        return { status: 'success', service_id: canonicalId, ...delayRes };
      } catch (e: any) {
        return { status: 'failed', error: e.message };
      }
    }

    case 'verify_service': {
      const service = simulator.getService(args.service_id);
      if (!service) return { status: 'failed', message: `Service '${args.service_id}' not found` };
      const canonicalId = service.service_id;
      broadcastEvent('verification_started', `Verifying service ${canonicalId}`, {}, runId);
      const verification = simulator.verifyService(canonicalId);
      if (verification.status === 'passed') {
        broadcastEvent('verification_succeeded', `Verified ${canonicalId} health & SLA compliance`, verification, runId);
      } else {
        broadcastEvent('verification_failed', `Verification failed for ${canonicalId}`, verification, runId);
      }
      return verification;
    }

    default:
      return { error: `Unknown tool '${name}'` };
  }
}
