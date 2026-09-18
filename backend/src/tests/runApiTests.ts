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

  // Test min instances constraint
  const belowMinCheck = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'orders-api',
    target_instances: orders.min_instances - 1, // Below min
  });
  assert(!belowMinCheck.allowed, 'Safety Engine rejects target below min_instances', belowMinCheck.reason);

  // Test max instances constraint
  const aboveMaxCheck = safetyEngine.validateAction({
    action: 'scale_up',
    service_id: 'orders-api',
    target_instances: orders.max_instances + 1, // Above max
  });
  assert(!aboveMaxCheck.allowed, 'Safety Engine rejects target above max_instances', aboveMaxCheck.reason);

  // Test stale metric check (checkout-api)
  const staleCheck = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'checkout-api',
    target_instances: 2,
  });
  assert(!staleCheck.allowed, 'Safety Engine rejects scale_down when live traffic is surging (stale data)', staleCheck.reason);

  // Test safe scale down (reports-worker)
  const safeScaleCheck = safetyEngine.validateAction({
    action: 'scale_down',
    service_id: 'reports-worker',
    target_instances: 1,
  });
  assert(safeScaleCheck.allowed, 'Safety Engine allows safe scale_down on idle reports-worker', safeScaleCheck.checks);

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
