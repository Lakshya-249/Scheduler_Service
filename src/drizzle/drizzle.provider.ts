import { drizzle } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

export const DrizzleAsyncProvider = 'drizzleProvider';

export const drizzleProvider = [
  {
    provide: DrizzleAsyncProvider,
    useFactory: async () => {
      const queryClient = postgres(process.env.DB_URL);
      const db = drizzle(queryClient, {
        schema,
        logger: true,
      });
      return db;
    },
    exports: [DrizzleAsyncProvider],
  },
];
