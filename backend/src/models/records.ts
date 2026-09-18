import mongoose, { Schema, Document } from 'mongoose';
import { getDatabaseStatus } from '../database/db';

export interface IActionRecord {
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

export interface IAgentRunRecord {
  runId: string;
  prompt: string;
  mode: 'ollama' | 'deterministic' | 'error';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  toolsCalled: { name: string; args: any; result: any; timestamp: string }[];
  finalResponse?: any;
  durationMs: number;
  timestamp: string;
}

export interface ICloudEvent {
  eventId: string;
  serviceId?: string;
  type: string;
  severity: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

// In-Memory Storage Arrays
const memoryActions: IActionRecord[] = [];
const memoryAgentRuns: IAgentRunRecord[] = [];
const memoryEvents: ICloudEvent[] = [];

// Mongoose Schemas
const ActionSchema = new Schema<IActionRecord>({
  actionId: { type: String, required: true, unique: true },
  serviceId: { type: String, required: true },
  action: { type: String, required: true },
  previousInstances: { type: Number, required: true },
  requestedInstances: { type: Number, required: true },
  finalInstances: { type: Number, required: true },
  status: { type: String, required: true },
  reason: { type: String },
  safetyChecks: [{ name: String, passed: Boolean, message: String }],
  verification: {
    status: { type: String, default: 'not_run' },
    actualInstances: Number,
    latencyMs: Number,
    healthy: Boolean,
    costPerHour: Number,
    message: String,
  },
  estimatedSavingsPerHour: { type: Number, default: 0 },
  timestamp: { type: String, default: () => new Date().toISOString() },
});

const AgentRunSchema = new Schema<IAgentRunRecord>({
  runId: { type: String, required: true, unique: true },
  prompt: { type: String, required: true },
  mode: { type: String, required: true },
  status: { type: String, required: true },
  toolsCalled: [{ name: String, args: Schema.Types.Mixed, result: Schema.Types.Mixed, timestamp: String }],
  finalResponse: { type: Schema.Types.Mixed },
  durationMs: { type: Number, default: 0 },
  timestamp: { type: String, default: () => new Date().toISOString() },
});

const CloudEventSchema = new Schema<ICloudEvent>({
  eventId: { type: String, required: true, unique: true },
  serviceId: { type: String },
  type: { type: String, required: true },
  severity: { type: String, default: 'info' },
  message: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toISOString() },
});

const ActionModel = mongoose.models.Action || mongoose.model<IActionRecord>('Action', ActionSchema);
const AgentRunModel = mongoose.models.AgentRun || mongoose.model<IAgentRunRecord>('AgentRun', AgentRunSchema);
const CloudEventModel = mongoose.models.CloudEvent || mongoose.model<ICloudEvent>('CloudEvent', CloudEventSchema);

// Data Access Layer with Dual Support
export const AuditRepository = {
  async saveAction(action: IActionRecord): Promise<void> {
    memoryActions.unshift(action);
    if (getDatabaseStatus().type === 'mongodb') {
      try {
        await ActionModel.create(action);
      } catch (e) {
        // Ignored, memory has it
      }
    }
  },

  async getAllActions(): Promise<IActionRecord[]> {
    if (getDatabaseStatus().type === 'mongodb') {
      try {
        return await ActionModel.find().sort({ timestamp: -1 }).lean();
      } catch (e) {
        return memoryActions;
      }
    }
    return memoryActions;
  },

  async getActionById(actionId: string): Promise<IActionRecord | undefined> {
    if (getDatabaseStatus().type === 'mongodb') {
      try {
        const found = await ActionModel.findOne({ actionId }).lean();
        if (found) return found as unknown as IActionRecord;
      } catch (e) {}
    }
    return memoryActions.find(a => a.actionId === actionId);
  },

  async saveAgentRun(run: IAgentRunRecord): Promise<void> {
    const existingIndex = memoryAgentRuns.findIndex(r => r.runId === run.runId);
    if (existingIndex >= 0) {
      memoryAgentRuns[existingIndex] = run;
    } else {
      memoryAgentRuns.unshift(run);
    }

    if (getDatabaseStatus().type === 'mongodb') {
      try {
        await AgentRunModel.findOneAndUpdate({ runId: run.runId }, run, { upsert: true });
      } catch (e) {}
    }
  },

  async getAllAgentRuns(): Promise<IAgentRunRecord[]> {
    if (getDatabaseStatus().type === 'mongodb') {
      try {
        return await AgentRunModel.find().sort({ timestamp: -1 }).lean();
      } catch (e) {
        return memoryAgentRuns;
      }
    }
    return memoryAgentRuns;
  },

  async getAgentRunById(runId: string): Promise<IAgentRunRecord | undefined> {
    if (getDatabaseStatus().type === 'mongodb') {
      try {
        const found = await AgentRunModel.findOne({ runId }).lean();
        if (found) return found as unknown as IAgentRunRecord;
      } catch (e) {}
    }
    return memoryAgentRuns.find(r => r.runId === runId);
  },

  async saveEvent(event: ICloudEvent): Promise<void> {
    memoryEvents.unshift(event);
    if (memoryEvents.length > 200) memoryEvents.pop();

    if (getDatabaseStatus().type === 'mongodb') {
      try {
        await CloudEventModel.create(event);
      } catch (e) {}
    }
  },

  async getEventsByService(serviceId: string): Promise<ICloudEvent[]> {
    if (getDatabaseStatus().type === 'mongodb') {
      try {
        return await CloudEventModel.find({ serviceId }).sort({ timestamp: -1 }).limit(20).lean();
      } catch (e) {}
    }
    return memoryEvents.filter(e => e.serviceId === serviceId).slice(0, 20);
  },

  async getAllEvents(): Promise<ICloudEvent[]> {
    if (getDatabaseStatus().type === 'mongodb') {
      try {
        return await CloudEventModel.find().sort({ timestamp: -1 }).limit(50).lean();
      } catch (e) {}
    }
    return memoryEvents.slice(0, 50);
  },
};
