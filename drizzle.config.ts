import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();
console.log(process.env.DB_URL);

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/drizzle/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DB_URL,
  },
});
