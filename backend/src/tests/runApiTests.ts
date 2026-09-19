import http from 'http';
import { simulator } from '../cloud/simulator';
import { safetyEngine } from '../safety/safetyEngine';
import { agent } from '../agent/agent';

// Force deterministic demo mode for offline reliable testing
agent.setDemoMode(true);

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✓ PASSED: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAILED: ${testName}`, detail || '');
    failCount++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🚀 Running CloudGuard AI Backend Test Suite');
  console.log('========================================\n');

  // 1. Safety Engine Unit Tests
  console.log('[1] Deterministic Safety Engine Unit Tests:');
  simulator.resetToDefault();

  const orders = simulator.getService('orders-api')!;
  assert(orders !== undefined, 'orders-api loaded in simulator');

  // Test min instances constraint (Constraint 1)
  const belowMinCheck = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'orders-api',
    target_instances: orders.min_instances - 1,
  });
  assert(!belowMinCheck.allowed, 'Constraint 1: Rejects target below min_instances', belowMinCheck.reason);

  // Test max instances constraint (Constraint 2)
  const aboveMaxCheck = safetyEngine.validateAction({
    action: 'scale_up',
    service_id: 'orders-api',
    target_instances: orders.max_instances + 1,
  });
  assert(!aboveMaxCheck.allowed, 'Constraint 2: Rejects target above max_instances', aboveMaxCheck.reason);

  // Test projected latency SLA breach (Constraint 3)
  const projectedSlaBreach = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'orders-api',
    target_instances: 2, // 1200 RPM on 2 instances would surge latency
  });
  assert(!projectedSlaBreach.allowed, 'Constraint 3: Rejects scale_down when projected latency violates SLA', projectedSlaBreach.reason);

  // Test degraded/unhealthy service check (Constraint 4)
  const degradedService = simulator.getService('payment-api')!;
  const origHealthy = degradedService.healthy;
  degradedService.healthy = false;
  const unhealthyCheck = safetyEngine.validateAction({
    action: 'scale_up',
    service_id: 'payment-api',
    target_instances: 4,
  });
  assert(!unhealthyCheck.allowed, 'Constraint 4: Rejects mutation on unhealthy/degraded service', unhealthyCheck.reason);
  degradedService.healthy = origHealthy; // restore

  // Test stale metric check (live traffic surge) (Constraint 5a)
  const staleSurgeCheck = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'checkout-api',
    target_instances: 2,
  });
  assert(!staleSurgeCheck.allowed, 'Constraint 5a: Rejects scale_down when live traffic is surging (stale data)', staleSurgeCheck.reason);

  // Test stale timestamp age check (Constraint 5b)
  const staleTimestamp = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes ago
  const staleAgeCheck = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'reports-worker',
    target_instances: 1,
    observed_timestamp: staleTimestamp,
  });
  assert(!staleAgeCheck.allowed, 'Constraint 5b: Rejects action when observed_timestamp is older than freshness threshold', staleAgeCheck.reason);

  // Test zero-traffic safety with active compute (Constraint 6)
  const workerService = simulator.getService('reports-worker')!;
  const origCpu = workerService.cpu_percent;
  workerService.cpu_percent = 85; // Active background compute
  const highCpuDownscale = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'reports-worker',
    target_instances: 1,
  });
  assert(!highCpuDownscale.allowed, 'Constraint 6: Rejects downscale when background compute is high (CPU 85%)', highCpuDownscale.reason);
  workerService.cpu_percent = origCpu; // restore

  // Test concurrency / version mismatch (Constraint 7)
  const versionConflict = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'reports-worker',
    target_instances: 1,
    observed_version: workerService.version + 99, // mismatch
  });
  assert(!versionConflict.allowed, 'Constraint 7: Rejects action when observed_version mismatches live cluster version', versionConflict.reason);

  // Test directional sanity (Constraint 8)
  const idleScaleUp = safetyEngine.validateAction({
    action: 'scale_up',
    service_id: 'reports-worker',
    target_instances: 4, // worker has 0 RPM and low CPU
  });
  assert(!idleScaleUp.allowed, 'Constraint 8a: Rejects scale_up on completely idle service', idleScaleUp.reason);

  const wrongDirectionDown = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'reports-worker',
    target_instances: workerService.instances, // target (4) >= current (4), should reject
  });
  assert(!wrongDirectionDown.allowed, 'Constraint 8b: Rejects scale_down when target >= current instances', wrongDirectionDown.reason);

  // Test schema validation (Constraint 9)
  const invalidSchemaNonInt = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'reports-worker',
    target_instances: 1.5 as any,
  });
  assert(!invalidSchemaNonInt.allowed, 'Constraint 9a: Rejects non-integer target_instances (1.5)', invalidSchemaNonInt.reason);

  const invalidSchemaNegative = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'reports-worker',
    target_instances: -1,
  });
  assert(!invalidSchemaNegative.allowed, 'Constraint 9b: Rejects negative target_instances (-1)', invalidSchemaNegative.reason);

  const invalidSchemaAction = safetyEngine.validateAction({
    action: 'delete_cluster' as any,
    service_id: 'reports-worker',
    target_instances: 1,
  });
  assert(!invalidSchemaAction.allowed, 'Constraint 9c: Rejects unsupported action type (delete_cluster)', invalidSchemaAction.reason);

  // Test safe scale down passes all constraints
  const safeScaleCheck = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'reports-worker',
    target_instances: 1,
    observed_version: workerService.version,
    observed_timestamp: new Date().toISOString(),
  });
  assert(safeScaleCheck.allowed, 'All Constraints: Allows safe scale_down on idle reports-worker with fresh telemetry', safeScaleCheck.checks);

  // 2. Simulator State & Capacity Failure
  console.log('\n[2] Cloud Simulator State & Capacity Constraints:');
  simulator.resetToDefault();
  const initialCost = simulator.getCloudSummary().totalCostPerHour;

  simulator.applyScale('reports-worker', 1);
  const workerPostScale = simulator.getService('reports-worker')!;
  assert(workerPostScale.instances === 1, 'reports-worker state changed to 1 instance');
  const postScaleCost = simulator.getCloudSummary().totalCostPerHour;
  assert(postScaleCost < initialCost, `Cost reduced from $${initialCost} to $${postScaleCost}`);

  // Test D capacity failure simulation
  let capacityFailed = false;
  try {
    simulator.applyScale('payment-api', 5);
  } catch (err: any) {
    capacityFailed = err.message === 'capacity_unavailable';
  }
  assert(capacityFailed, 'payment-api throws capacity_unavailable when scaled > 4');

  // 3. Scenario Loader & Reset Tests
  console.log('\n[3] Scenario Management Tests:');
  const loadB = simulator.loadScenario('testB');
  assert(loadB, 'loadScenario("testB") returned true');
  const ordersB = simulator.getService('orders-api')!;
  assert(ordersB.requests_per_minute === 4200, 'testB scenario has 4200 RPM for orders-api');

  const resetOk = simulator.resetToDefault();
  assert(resetOk, 'resetToDefault() returned true');
  const ordersReset = simulator.getService('orders-api')!;
  assert(ordersReset.requests_per_minute === 1200, 'orders-api reset back to default 1200 RPM');

  // 4. Autonomous Agent Workflow Execution (Tests A, B, C, D)
  console.log('\n[4] Autonomous Agent Workflow Tests:');

  // Test A
  simulator.loadScenario('testA');
  const resA = await agent.runTask("Review the current services and reduce unnecessary cost without breaking the latency or availability requirements.");
  assert(resA.decision.action === 'scale_down', 'Test A: Agent proposed scale_down');
  assert(resA.decision.to_instances === 1, 'Test A: Agent scaled reports-worker to 1 instance');
  assert(resA.execution.status === 'success', 'Test A: Execution marked as success');
  assert(resA.verification.status === 'passed', 'Test A: Verification confirmed passed');
  assert(resA.estimated_savings_per_hour > 0, `Test A: Estimated savings $${resA.estimated_savings_per_hour}/hr calculated`);

  // Test B
  simulator.loadScenario('testB');
  const resB = await agent.runTask("Orders traffic is increasing. Keep the service within its latency target.");
  assert(resB.decision.action === 'scale_up', 'Test B: Agent proposed scale_up to handle traffic');
  assert(resB.execution.status === 'success', 'Test B: Execution succeeded');
  assert(resB.verification.status === 'passed', 'Test B: Verification confirmed post-action health');

  // Test C
  simulator.loadScenario('testC');
  const resC = await agent.runTask("Reduce cost if it is safe.");
  assert(resC.decision.action === 'no_action', 'Test C: Agent refused scale_down due to stale/surging traffic');
  assert(resC.safety.status === 'rejected', 'Test C: Safety Engine rejected action');

  // Test D
  simulator.loadScenario('testD');
  const resD = await agent.runTask("Scale the payment service only if the current state requires it.");
  assert(resD.execution.status === 'failed', 'Test D: Agent accurately recorded execution failure');
  assert(resD.execution.error === 'capacity_unavailable', 'Test D: Accurate error reason capacity_unavailable');
  assert(resD.verification.status === 'failed', 'Test D: Verification accurately reported failed');

  // Reset after tests
  simulator.resetToDefault();

  console.log('\n========================================');
  console.log(`📊 Test Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('========================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test suite failed with unexpected exception:', err);
  process.exit(1);
});
