import { config } from 'dotenv';

const envFile = process.env.TEST_ENV ? `.env.${process.env.TEST_ENV}` : '.env';
config({ path: envFile, quiet: true });

export const env = {
  baseURL: process.env.E2E_BASE_URL ?? 'https://example.com',
  username: process.env.E2E_USERNAME,
  password: process.env.E2E_PASSWORD,
  name: process.env.TEST_ENV ?? 'local',
};
