# CloudGuard AI — Production-Quality Autonomous Cloud Cost Optimization Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38b2ac.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.0-black.svg)](https://expressjs.com/)

> **Pragyaan 2.0 – Clash of Devs – Agentic AI Hackathon**

---

## 🚀 Overview

**CloudGuard AI** is an autonomous, AI-driven cloud cost optimization platform. It simulates a distributed cloud microservices infrastructure, runs a multi-step agentic loop to investigate telemetry, and enforces a deterministic backend Safety Engine before executing mutations and conducting post-action SLA verifications.

```
                  USER (Natural Language Request)
                               │
                               ▼
                    ┌─────────────────────┐
                    │     AI AGENT        │
                    │   (Ollama / Demo)   │
                    └──────────┬──────────┘
                               │ Tool Calls
                               ▼
                    ┌─────────────────────┐
                    │ SIMULATED CLOUD API │
                    │   (Services/SLA)    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ PROPOSED MUTATION   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    SAFETY ENGINE    │
                    │  Deterministic Code │
                    └──────┬────────┬─────┘
                           │        │
                     ALLOW │        │ REJECT
                           ▼        ▼
                    ┌──────────┐ ┌──────────┐
                    │ EXECUTE  │ │ EXPLAIN  │
                    └────┬─────┘ └──────────┘
                         ▼
                    ┌──────────┐
                    │  VERIFY  │
                    └────┬─────┘
                         ▼
                    AUDIT REPORT
```

---

## 🌟 Key Features

1. **Autonomous Agent Loop**: Follows the `OBSERVE → INVESTIGATE → REASON → DECIDE → SAFETY CHECK → ACT → VERIFY → REPORT` workflow.
2. **Deterministic Safety Engine**: Enforces 10+ server-side hard boundaries (min/max instances, health, directional sanity, concurrency versions, freshness threshold, latency SLAs).
3. **Dual AI Mode (Zero-Dependency Guarantee)**:
   - Connects to local **Ollama** (`qwen2.5:7b` or `llama3`).
   - Seamlessly falls back to an **Intelligent Deterministic Agent Engine** when Ollama is offline so demos never fail.
4. **Real-time Streaming**: Live WebSocket pipe streaming every agent decision, tool call, safety check, and verification.
5. **Multi-Page Enterprise Dashboard**:
   - **Overview Dashboard**: Fleet spend, avoidable waste, Recharts cost & capacity trends.
   - **Cloud Services**: Searchable, filterable table with SLA indicators and inspection modals.
   - **AI Agent Console**: Prompt input, benchmark test triggers, live streaming terminal, and structured verdict cards.
   - **Action Audit Trail**: Immutable history with live revalidation & comparison.
   - **Test Scenarios**: One-click scenario switchers for Tests A, B, C, and D.
   - **System Diagnostics**: Live connectivity checks for API, DB, Ollama, and WebSockets.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript | Modern, high-performance UI |
| **Styling** | Tailwind CSS v4 | Professional dark mode cloud DevOps aesthetics |
| **Charts** | Recharts | Time-series cost trajectory & capacity graphs |
| **Backend** | Node.js, Express 5, TypeScript | REST APIs, business logic, safety gate |
| **AI / LLM** | Ollama (`qwen2.5:7b`) + Deterministic Fallback | Autonomous reasoning and tool orchestration |
| **Real-Time** | Native `ws` + Browser WebSocket | Low-latency live agent activity stream |
| **Validation** | Zod | Strict input, parameter, and report schema validation |
| **Logging** | Pino & Pino-Pretty | Structured backend operational logs |
| **Database** | MongoDB Atlas / In-Memory Dual Adapter | Full audit persistence with zero mandatory setup |

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- Optional: [Ollama](https://ollama.com/) with `ollama run qwen2.5:7b`

### 2. Run the Backend
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:3001` (WebSocket at `ws://localhost:3001`)*

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens at `http://localhost:5173`*

---

## 🧪 Benchmark Test Scenarios

Execute these benchmark scenarios directly from the **AI Agent Console** or **Test Scenarios** tab:

### **Test A — Cost Optimization (Idle Worker)**
- **Prompt**: `"Review the current services and reduce unnecessary cost without breaking the latency or availability requirements."`
- **Telemetry**: `reports-worker` has 0 RPM, 9% CPU, and 4 nodes running (min: 1).
- **Agent Behavior**: Investigates metrics, validates bounds, scales down 4 → 1 node.
- **Result**: Successfully verified; saves **$8.25/hr** (or **$33/hr** under 4x scaling rate).

### **Test B — Rising Traffic Surge (Orders API)**
- **Prompt**: `"Orders traffic is increasing. Keep the service within its latency target."`
- **Telemetry**: `orders-api` traffic doubled to 4200 RPM, latency reached 260ms (close to 300ms SLA).
- **Agent Behavior**: Recognizes latency pressure, proposes scale-up 4 → 5 nodes to safeguard SLA.
- **Result**: Verified; latency drops safely.

### **Test C — Stale Metrics Detection (Checkout API)**
- **Prompt**: `"Reduce cost if it is safe."`
- **Telemetry**: `checkout-api` observed metric was 900 RPM (stale timestamp), but live stream is 5200 RPM.
- **Agent Behavior**: Calls `get_latest_traffic`, discovers live surge, rejects scale-down.
- **Result**: Safety Engine blocks mutation; protects availability.

### **Test D — Cloud Capacity Failure (Payment API)**
- **Prompt**: `"Scale the payment service only if the current state requires it."`
- **Telemetry**: `payment-api` at 91% CPU and 410ms latency. Proposes scale-up to 5 nodes.
- **Agent Behavior**: Cloud provider throws `capacity_unavailable`.
- **Result**: Agent never fakes success; records accurate failure reason and alerts user.

---

## 📡 Automated Test Suite

Run the automated backend test suite covering all Safety Engine rules, simulator constraints, scenario loaders, and agent workflows:

```bash
cd backend
npm test
```
*Result: 25 Passed, 0 Failed*

Run HTTP API route integration tests:
```bash
cd backend
npx tsx src/tests/testHttpRoutes.ts
```
*Result: 20 Passed, 0 Failed*

---

## 🔒 Safety Engine Architecture

The Safety Engine is deterministic backend TypeScript code. The LLM is **never** granted direct cloud mutation permissions.

```typescript
// Deterministic Safety Gate:
1. Valid service existence
2. Supported action type ('scale_up', 'scale_down', 'stop_idle_service', 'no_action')
3. Minimum capacity boundary (target >= min_instances)
4. Maximum capacity boundary (target <= max_instances)
5. Service health requirement
6. Data freshness validation (stale vs live traffic delta)
7. State concurrency version check (v_observed === v_current)
8. Latency SLA buffer guard
9. Zero-traffic requirement for service stopping
```
