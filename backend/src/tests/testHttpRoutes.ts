import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import { healthRouter } from '../routes/health';
import { servicesRouter } from '../routes/services';
import { cloudRouter } from '../routes/cloud';
import { agentRouter } from '../routes/agent';
import { actionsRouter } from '../routes/actions';
import { scenariosRouter } from '../routes/scenarios';
import { configRouter } from '../routes/config';
import { agent } from '../agent/agent';

agent.setDemoMode(true);

const app = express();
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).requestId = 'test-req-id';
  next();
});

app.use('/api', healthRouter);
app.use('/api', servicesRouter);
app.use('/api', cloudRouter);
app.use('/api', agentRouter);
app.use('/api', actionsRouter);
app.use('/api', scenariosRouter);
app.use('/api', configRouter);

const server = http.createServer(app);

function request(method: string, path: string, body?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as any;
    const req = http.request(
      {
        host: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let raw = '';
        res.on('data', chunk => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode || 500, body: raw });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runHttpTests() {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as any;
  console.log(`Testing HTTP API routes on port ${addr.port}...\n`);

  let passes = 0;
  let fails = 0;

  function check(cond: boolean, name: string, data?: any) {
    if (cond) {
      console.log(`  ✓ ${name}`);
      passes++;
    } else {
      console.error(`  ✗ ${name}`, data);
      fails++;
    }
  }

  // 1. Health routes
  const h = await request('GET', '/api/health');
  check(h.status === 200 && h.body.data.status === 'healthy', 'GET /api/health');

  const sys = await request('GET', '/api/system/status');
  check(sys.status === 200 && sys.body.data.system === 'online', 'GET /api/system/status');

  const cfg = await request('GET', '/api/system/config-status');
  check(cfg.status === 200 && cfg.body.data.port !== undefined, 'GET /api/system/config-status');

  // 2. Services routes
  const sList = await request('GET', '/api/services');
  check(sList.status === 200 && Array.isArray(sList.body.data), 'GET /api/services');

  const sDetail = await request('GET', '/api/services/orders-api');
  check(sDetail.status === 200 && sDetail.body.data.service_id === 'orders-api', 'GET /api/services/orders-api');

  const sMetrics = await request('GET', '/api/services/orders-api/metrics');
  check(sMetrics.status === 200 && sMetrics.body.data.cpu_percent !== undefined, 'GET /api/services/orders-api/metrics');

  const sTraffic = await request('GET', '/api/services/orders-api/traffic');
  check(sTraffic.status === 200 && sTraffic.body.data.requests_per_minute !== undefined, 'GET /api/services/orders-api/traffic');

  const sCost = await request('GET', '/api/services/orders-api/cost');
  check(sCost.status === 200 && sCost.body.data.cost_per_hour !== undefined, 'GET /api/services/orders-api/cost');

  const sVerify = await request('GET', '/api/services/orders-api/verify');
  check(sVerify.status === 200 && sVerify.body.data.status !== undefined, 'GET /api/services/orders-api/verify');

  // 3. Cloud routes
  const cSumm = await request('GET', '/api/cloud/summary');
  check(cSumm.status === 200 && cSumm.body.data.totalCostPerHour > 0, 'GET /api/cloud/summary');

  const cCostH = await request('GET', '/api/cloud/cost-history');
  check(cCostH.status === 200 && Array.isArray(cCostH.body.data), 'GET /api/cloud/cost-history');

  const cInstH = await request('GET', '/api/cloud/instance-history');
  check(cInstH.status === 200 && Array.isArray(cInstH.body.data), 'GET /api/cloud/instance-history');

  // 4. Scenarios routes
  const scList = await request('GET', '/api/scenarios');
  check(scList.status === 200 && scList.body.data.length >= 4, 'GET /api/scenarios');

  const scLoad = await request('POST', '/api/scenarios/testA/load');
  check(scLoad.status === 200 && scLoad.body.data.summary.activeScenario === 'testA', 'POST /api/scenarios/testA/load');

  const scReset = await request('POST', '/api/scenarios/reset');
  check(scReset.status === 200 && scReset.body.data.summary.activeScenario === 'default', 'POST /api/scenarios/reset');

  // 5. Actions routes
  const actList = await request('GET', '/api/actions');
  check(actList.status === 200 && Array.isArray(actList.body.data), 'GET /api/actions');

  // 6. Config routes
  const llmStatus = await request('GET', '/api/config/llm-status');
  check(llmStatus.status === 200 && llmStatus.body.data.model !== undefined, 'GET /api/config/llm-status');

  const setDemo = await request('POST', '/api/config/demo-mode', { enabled: true });
  check(setDemo.status === 200 && setDemo.body.data.demoModeActive === true, 'POST /api/config/demo-mode');

  // 7. Agent run route
  const agentRes = await request('POST', '/api/agent/run', { prompt: 'Review services and optimize' });
  check(agentRes.status === 200 && agentRes.body.data.summary !== undefined, 'POST /api/agent/run');

  const agentRuns = await request('GET', '/api/agent/runs');
  check(agentRuns.status === 200 && agentRuns.body.data.length > 0, 'GET /api/agent/runs');

  server.close();

  console.log(`\nHTTP Route Verification: ${passes} Passed, ${fails} Failed\n`);
  if (fails > 0) process.exit(1);
}

runHttpTests().catch(e => {
  console.error(e);
  process.exit(1);
});
