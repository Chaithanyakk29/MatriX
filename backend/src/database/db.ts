import mongoose from 'mongoose';
import pino from 'pino';

const logger = pino({ name: 'database' });

export interface DatabaseStatus {
  connected: boolean;
  type: 'mongodb' | 'in-memory';
  uri?: string;
  error?: string;
}

let dbStatus: DatabaseStatus = {
  connected: false,
  type: 'in-memory',
};

export async function connectDatabase(): Promise<DatabaseStatus> {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.info('No MONGO_URI provided in environment. Running with high-performance in-memory persistence.');
    dbStatus = {
      connected: true,
      type: 'in-memory',
    };
    return dbStatus;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    logger.info('Connected to MongoDB Atlas successfully.');
    dbStatus = {
      connected: true,
      type: 'mongodb',
      uri: mongoUri.replace(/\/\/.*@/, '//***:***@'), // Redact secrets
    };
    return dbStatus;
  } catch (err: any) {
    logger.warn(`Failed to connect to MongoDB (${err.message}). Falling back gracefully to in-memory persistence.`);
    dbStatus = {
      connected: true,
      type: 'in-memory',
      error: err.message,
    };
    return dbStatus;
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  return dbStatus;
}
