# The Cloud Bill That Wouldn't Stop Growing

## 1. Team Details

**Team Name / ID:** matrix

**Team Lead:** C. Manimuktesh

**Team Members:**

- C. Manimuktesh | Team Lead + Agent/AI Engineer
- V. Aniketh | Backend + Simulated Cloud Engineer
- Ch. Chaithanya | Frontend + UI/UX Engineer
- M. Jagadhabhiram | Safety + Data Engineer
- U. Pavan Kumar | Integration + Testing Engineer

**Repo Link (Optional):** https://github.com/Chaithanyakk29/MatriX

**Demo Link (Optional):** N/A

---

## 2. Problem Statement

The Cloud Bill That Wouldn't Stop Growing

Context

It is Monday morning; your team receives an alert: “Cloud spending is 37% higher than expected.”
Nobody knows why. Your company operates several backend services. Each service exposes
information such as:
● CPU utilization
● memory utilization
● request count
● response latency
● number of running instances
● current hourly cost
● recent traffic
● availability

The Challenge

Build an autonomous cloud cost-optimization agent that monitors a simulated cloud environment,
investigates unexpected spending, chooses safe actions, executes them through APIs, and verifies
whether the action actually improved the situation. The agent receives natural-language requests
and structured cloud state. AI must play a meaningful role in deciding what to investigate and what
action to take; deterministic backend code must enforce safety constraints.

Core Requirements

● Accept a natural-language request together with the supplied service/environment data.
● Inspect service metrics, traffic, health, instance counts, pricing, constraints, and recent events
through APIs/tools.
● Choose among available actions such as scale up, scale down, resize, stop an idle service, delay a
batch workload, or take no action.
● Respect minimum/maximum capacity, latency, availability, and health constraints.
● Handle stale observations, changing conditions, failed actions, and post-action verification.
● Return a final response explaining the observed problem, action taken or not taken, and
verification result.

Test Input A — Cost optimization request

User prompt:
"Review the current services and reduce unnecessary cost without breaking the
latency or availability requirements."

services.json:
[
 {
  "service_id": "orders-api",
  "cpu_percent": 22,
  "memory_percent": 41,
  "requests_per_minute": 1200,
  "latency_ms": 180,
  "instances": 6,
  "cost_per_hour": 18.50,
  "min_instances": 2,
  "max_instances": 8,
  "max_latency_ms": 300,
  "healthy": true,
  "timestamp": "2026-09-17T10:30:00Z"
 },
 {
  "service_id": "reports-worker",
  "cpu_percent": 9,
  "memory_percent": 15,
  "requests_per_minute": 0,
  "latency_ms": 0,
  "instances": 4,
  "cost_per_hour": 11.00,
  "min_instances": 1,
  "max_instances": 6,
  "max_latency_ms": 900,
  "healthy": true,
  "timestamp": "2026-09-17T10:30:00Z"
 }
]

Test Input B — Rising traffic

User prompt:
"Orders traffic is increasing. Keep the service within its latency target."

service.json:
{
  "service_id": "orders-api",
  "cpu_percent": 28,
  "memory_percent": 48,
  "requests_per_minute": 4200,
  "previous_requests_per_minute": 2100,
  "latency_ms": 260,
  "instances": 4,
  "cost_per_hour": 18.50,
  "min_instances": 2,
  "max_instances": 8,
  "max_latency_ms": 300,
  "healthy": true,
  "timestamp": "2026-09-17T10:30:00Z"
}

Test Input C — Stale observation

User prompt:
"Reduce cost if it is safe."

metric.json:
{
  "service_id": "checkout-api",
  "cpu_percent": 24,
  "memory_percent": 39,
  "requests_per_minute": 900,
  "latency_ms": 170,
  "instances": 5,
  "cost_per_hour": 20.00,
  "min_instances": 2,
  "max_instances": 8,
  "max_latency_ms": 250,
  "healthy": true,
  "timestamp": "2026-09-17T08:00:00Z"
}

latest_traffic.json:
{
  "service_id": "checkout-api",
  "requests_per_minute": 5200,
  "timestamp": "2026-09-17T10:30:00Z"
}

Test Input D — Failed action

User prompt:
"Scale the payment service only if the current state requires it."

service.json:
{
  "service_id": "payment-api",
  "cpu_percent": 91,
  "memory_percent": 82,
  "requests_per_minute": 6400,
  "latency_ms": 410,
  "instances": 3,
  "cost_per_hour": 22.00,
  "min_instances": 2,
  "max_instances": 8,
  "max_latency_ms": 300,
  "healthy": true,
  "timestamp": "2026-09-17T10:30:00Z"
}

action_result.json:
{
  "action_id": "act-784",
  "action": "scale_up",
  "requested_instances": 5,
  "status": "failed",
  "error": "capacity_unavailable"
}

---

## 3. TL;DR

**Problem:** Cloud spending can rise unexpectedly when services have unused or poorly matched capacity.

**Solution:** CloudGuard AI investigates simulated cloud data, proposes safe actions, executes them, and verifies results.

**Who benefits:** Cloud operations teams can reduce waste while protecting performance, availability, and service health.

---

## 4. Scope of the Project

**What are you building?**

CloudGuard AI is an autonomous, production-quality cloud cost-optimization agent platform. It simulates a distributed cloud microservices environment, receives natural-language cost and scaling requests, executes a multi-step agentic loop (`OBSERVE → INVESTIGATE → REASON → DECIDE → SAFETY CHECK → ACT → VERIFY → REPORT`) via tool calls, enforces a server-side deterministic Safety Engine (10+ hard boundaries), mutates simulated cloud capacity, performs post-action SLA verifications, and streams real-time telemetry to an enterprise multi-page React dashboard.

**How does it solve the problem statement?**

It bridges autonomous AI reasoning with zero-trust backend governance. The agent dynamically queries live metrics via inspection tools, detects metric staleness by comparing snapshot timestamps against real-time traffic, and proposes structured state mutations. A separate deterministic TypeScript Safety Engine validates hard SLA boundaries (min/max nodes, max latency, health status, concurrency versions) before any execution occurs. Finally, the agent executes post-action verification and streams an auditable report to prevent silent failures and unsafe capacity changes.

**Key features you're building for this hackathon:**

- Natural-Language Agent Console & Scenario Triggers (Interactive prompt input + 1-click Benchmark Scenarios A–D)
- Autonomous Multi-Step Agentic Loop with Dual AI Mode (Ollama `qwen2.5:7b` + Intelligent Deterministic Fallback)
- Deterministic 10-Point Safety Engine (Hard capacity bounds, latency SLAs, concurrency locks, data freshness, zero-traffic rules)
- Simulated Cloud Provider API & Real-Time Event Bus (REST microservices simulator + native WebSocket `ws` streaming)
- Enterprise Multi-Page Dashboard & Audit Trail (6-page React 19 UI with Fleet Overview, Services Directory, Audit Logs, Diagnostics)

**What are you deliberately NOT doing? (Optional)**

We are deliberately not provisioning live AWS/Azure/GCP cloud infrastructure, Kubernetes clusters, or Terraform pipelines. The project focuses strictly on agentic reasoning, tool-use autonomy, deterministic safety gating, real-time feedback loops, and empirical verification within a controlled, high-fidelity cloud simulator.

---

## 5. Why an Agentic Approach?

**What does your agent decide or do on its own?**

The agent autonomously determines which tools to invoke (`get_services`, `get_service_metrics`, `get_latest_traffic`, `get_action_history`), which service metrics to inspect, whether observed metrics are stale relative to live traffic, what optimal capacity adjustments are needed, whether to halt or scale down idle services, and how to verify post-action state changes. If a cloud API fails or capacity is unavailable (e.g., Test D), the agent autonomously detects the error, avoids faking success, and generates a failure audit report.

**Why wouldn't a fixed script, if-else rules, or a simple chatbot be enough?**

Static scripts and hardcoded if-else rules fail under dynamic operational contexts—such as handling ambiguous natural-language intent, discovering unexpected traffic spikes, or correlating historical metrics with real-time stream deltas. A standard conversational chatbot can only offer textual advice without executing tool calls or interacting with backend systems. An agentic approach enables active investigation, flexible reasoning, safe autonomous execution, and post-action SLA verification in closed-loop operational workflows.

---

## 6. Who It's For & What Changes

**Who or what is this for?**

Cloud DevOps engineers, Site Reliability Engineers (SREs), and FinOps teams managing multi-service cloud infrastructure, infrastructure spend, latency SLAs, and capacity scaling.

**The world today, without your solution:**

Cloud cost alerts force SREs to manually comb through disparate monitoring tools, analyze CPU/RAM metrics, guess at traffic trends, and manually execute scaling commands. Stale metrics or uncoordinated manual changes frequently lead to broken SLAs, unexpected cost spikes, or service outages.

**The world with your solution, fully built and scaled to production:**

An autonomous agent continuously monitors infrastructure telemetry, detects cost waste or traffic anomalies, executes safety-gated multi-service optimizations via cloud APIs, validates post-change performance against SLAs, and maintains an immutable, audited record of all automated operational decisions.

**What your hackathon build actually delivers today:**

A fully working prototype featuring a high-fidelity REST cloud simulator, a complete agentic loop with Dual AI engine (Ollama + Intelligent Fallback), a deterministic 10-point backend Safety Engine, real-time WebSocket event streaming, an automated test suite (45 unit/integration tests), and a 6-view React 19 + Tailwind v4 + Recharts management dashboard.

**Before vs. After**

| What Changes | Today | With Our Current Build | At Production Scale |
|--------------|-------|------------------------|---------------------|
| Cost investigation | Manual metric inspection across monitoring tools | Agent autonomously investigates simulated service telemetry & traffic deltas | Continuous multi-cloud anomaly detection & automated telemetry analysis |
| Capacity decisions | Manual calculations or rigid auto-scaler thresholds | AI proposes mutations; deterministic 10-point Safety Engine validates hard bounds | Closed-loop policy engine with AI optimization & enterprise RBAC approvals |
| Action verification | Manual post-mortem verification & spot checks | Automated post-action SLA validation & state re-inspection | Continuous automated health verification & automatic rollback triggers |
| Audit trail | Scattered operational logs & ticket history | Immutable MongoDB / In-memory action audit log with visual delta comparisons | Enterprise centralized audit vault with compliance reporting & SIEM integration |

---

## 7. Architecture & Agents

**How is your system put together?**

Users submit natural-language prompts or launch test scenarios via the React 19 dashboard. The Cloud Optimization Agent initiates its loop, utilizing tools (`get_services`, `get_service_metrics`, `get_latest_traffic`, `get_action_history`) to query the Express backend REST API. When proposing state mutations (e.g., `scale_up`, `scale_down`, `stop_idle_service`), the agent submits a structured payload (validated by Zod) to the Safety Engine. The Safety Engine deterministically enforces 10 safety rules before allowing the Simulator API to modify service state. Results and audit records are persisted in MongoDB Atlas (or In-Memory fallback) and streamed live to the UI via native WebSockets.

### 7.1 Agents

- **Cloud Optimization Agent:** Interprets natural language, selects and executes inspection tools, reasons over cost vs. SLA constraints, detects stale observations, proposes capacity mutations, handles execution failures, and conducts post-action verifications. Powered by Dual AI Mode: local Ollama (`qwen2.5:7b` / `llama3`) with fallback to an Intelligent Deterministic Agent Engine.

### 7.2 Services, APIs, Databases & Memory

- **Simulated Cloud API (Express 5 + TypeScript):** REST API managing microservices state, metric snapshots, live traffic streams, capacity limits, and mutation execution.
- **Safety Engine (Backend Module):** Server-side governance module deterministically verifying proposed actions against 10 hard safety rules (min/max instances, latency target, health, freshness threshold, version locks, directional sanity).
- **Dual Database Layer (MongoDB Atlas + In-Memory Adapter):** Persistent database storing services, metrics, traffic events, agent decisions, execution logs, and audit trails, with automatic fallback for zero-config operation.
- **WebSocket Streaming Engine (`ws`):** Real-time pub/sub event pipeline streaming live agent reasoning steps, tool calls, safety checks, execution results, and audit events.
- **Enterprise Dashboard (React 19 + Vite + Tailwind v4 + Recharts):** 6-page frontend providing Fleet Overview, Services Directory, Agent Console with scenario switchers, Immutable Audit Log, and System Diagnostics.
- **Ollama + Qwen LLM (`qwen2.5:7b`):** Local open-weights LLM running via Ollama for autonomous tool calling and reasoning without external API cost or latency.

**How does your system remember things (memory & state)?**

The system utilizes a dual-layer persistence strategy: MongoDB Atlas (or an In-Memory dual adapter) records all service states, metric history, live traffic deltas, agent tool calls, safety validation decisions, and post-action audit trails. Additionally, the Cloud Simulator maintains optimistic concurrency state versioning (`concurrency_version`) on every service to prevent race conditions during concurrent agent actions.

**Diagram Link (Optional):** N/A

### 7.3 Example Walkthrough

**Example input:** "Review the current services and reduce unnecessary cost without breaking the latency or availability requirements."

1. **React Dashboard** sends the natural-language request over HTTP/WebSocket to the agent orchestrator.
2. **Cloud Optimization Agent** initializes the observe phase and executes `get_services` tool call to discover active microservices (`orders-api`, `reports-worker`).
3. **Agent** calls `get_service_metrics` for candidate services, identifying `reports-worker` running 4 instances at 0 RPM, 9% CPU, and $11.00/hr cost.
4. **Agent** calls `get_latest_traffic` to verify that zero traffic is an ongoing state rather than a stale reading.
5. **Agent** formulates a structured `scale_down` proposal target of 1 instance (saving $8.25/hr).
6. **Safety Engine** executes 10 deterministic checks: verifies service exists, action is valid, target instances (1) >= min_instances (1), target instances (1) <= max_instances (6), service is healthy, metrics are fresh, and latency SLA is respected.
7. **Simulated Cloud API** updates `reports-worker` instances to 1 and recalculates hourly cost.
8. **Agent** conducts post-action verification by re-querying service state, validating health and cost reduction.
9. **WebSocket Pipe** streams all steps to the React AI Console in real time, rendering an immutable verdict card.

**Final output:** A structured audit report detailing observed telemetry, proposed action (`scale_down` 4 → 1), safety verification status (`ALLOWED`), execution status (`SUCCESS`), post-action SLA verification (`PASSED`), and net cost savings ($8.25/hr).

**Anything special about how your workflow runs? (Optional)**

The workflow runs as a strictly governed, closed loop: `OBSERVE → INVESTIGATE → REASON → DECIDE → SAFETY CHECK → ACT → VERIFY → REPORT`. The LLM is never given direct write access to cloud resources; all mutations must pass through the deterministic Safety Engine. In addition, the Dual AI Engine guarantees 100% operational uptime by falling back to an intelligent rule-based reasoning engine if the local LLM becomes unresponsive.

---

## 8. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend / Interface | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Styling & Charts | Tailwind CSS v4 + Recharts (Time-series cost & capacity graphs) |
| Backend | Node.js + Express 5 + TypeScript + Zod + Pino |
| Agent Framework | Custom Multi-Step Tool-Calling Agent Loop (Dual AI: Ollama `qwen2.5:7b` + Intelligent Fallback) |
| Real-Time Communication | Native WebSocket (`ws` module) real-time event pipeline |
| Database / Storage | MongoDB Atlas (Free Tier) + In-Memory Dual Database Adapter |
| Hosting & Testing | Localhost + Automated Test Suite (45 Unit, Integration & API Route Tests) |
| Other | Zod (Schema Validation), Pino / Pino-Pretty (Structured Logging), Git/GitHub |

---

## 9. What to Expect From Our Current Build

**Working:**

- Full autonomous agentic loop with active tool calling (`get_services`, `get_service_metrics`, `get_latest_traffic`, `get_action_history`).
- Server-side deterministic Safety Engine enforcing 10+ strict boundaries (capacity min/max, latency SLAs, freshness thresholds, state concurrency, directional sanity).
- Dual AI Mode: Seamless integration with local Ollama (`qwen2.5:7b`) and automated zero-downtime fallback to Intelligent Deterministic Agent Engine.
- Real-time WebSocket streaming of agent reasoning, tool execution, safety decisions, and verification steps.
- 6-page enterprise React 19 UI with Fleet Overview, Services Table, AI Console, Immutable Audit Trail, Scenarios Page, and System Diagnostics.
- Automated Test Suite with 45+ unit, integration, and HTTP API route tests passing 100%.
- Complete execution of Benchmark Scenarios A (Cost Optimization), B (Traffic Surge), C (Stale Metrics Detection), and D (Capacity Failure Handling).

**Partly working, mocked, or hard-coded:**

- Cloud infrastructure is simulated via high-fidelity REST APIs and memory models rather than live AWS/Azure/GCP cloud providers.
- Benchmark test scenarios A–D use controlled initial JSON states to demonstrate specific edge cases reliably.

**Not working or not built yet:**

- Live multi-cloud IAM integration and real cloud infrastructure mutation (Terraform/Kubernetes API drivers).
- Production multi-tenant user authorization (RBAC) and OAuth authentication.

**What we'd most like to be judged on:**

We would like to be judged on our robust, production-grade agentic architecture: combining autonomous tool-based LLM reasoning with an uncompromised, server-side deterministic Safety Engine that enforces hard SLA boundaries, detects stale data, handles cloud capacity failures, verifies post-action outcomes, and streams transparent audit trails in real time.

---

## 10. Future Scope

### Idea 1

**Name:** Multi-Cloud Infrastructure Adapters (AWS / GCP / Azure)

**What it is:** Extend the simulator interface into a plugin-based cloud abstraction layer supporting AWS EC2/ECS, GCP Compute Engine, and Azure VM Scale Sets.

**Why it matters:** Enables real-world enterprise deployment across multi-cloud environments without altering the agentic loop or safety engine code.

**How we'd build it:** Implement provider-specific SDK drivers (AWS SDK v3, Azure Management SDK) behind a unified `ICloudProvider` interface.

**Done when:** The agent can safely inspect, scale, and verify live cloud resources across AWS, GCP, and Azure using provider-specific API credentials.

### Idea 2

**Name:** Autonomous Anomaly Detection & Scheduled Monitoring

**What it is:** Introduce a continuous background monitoring engine that detects unpredicted cost spikes and metric anomalies to trigger proactive agent investigations.

**Why it matters:** Eliminates the need for manual prompt triggering, allowing the agent to resolve cost bloat and latency risks before SREs notice them.

**How we'd build it:** Deploy a cron/event-driven metric collector with statistical anomaly detection algorithms feeding event triggers into the agent loop.

**Done when:** A simulated cloud metric anomaly automatically initiates agent investigation, safety checks, execution, and email/Slack notification delivery.

### Idea 3 (Optional)

**Name:** Human-in-the-Loop (HITL) Policy & Approval Workflow

**What it is:** Configurable governance rules that route high-cost or high-risk capacity changes to SRE teams for one-click approval before execution.

**Why it matters:** Provides enterprise teams with granular control over high-impact infrastructure mutations while automating routine, low-risk scaling.

**How we'd build it:** Add risk-tier classification in the Safety Engine, pause execution for actions flagged as High Risk, and send interactive approval cards to the frontend UI and Slack/Teams.

**Done when:** High-risk actions pause in a `PENDING_APPROVAL` state and execute only after an authorized engineer clicks Approve in the dashboard.

---

## 11. Additional Notes (Optional)

CloudGuard AI was architected from the ground up around strict separation of concerns: AI handles non-deterministic investigation and reasoning; server-side TypeScript code enforces absolute safety governance; the REST simulator provides deterministic execution environment; post-action checks verify actual SLA compliance; and real-time WebSockets ensure complete visual transparency. The platform includes full offline capability through local LLMs (Ollama) and dual-adapter fallbacks, delivering zero-dependency setup for evaluation.