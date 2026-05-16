import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения из .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  schema: './db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
