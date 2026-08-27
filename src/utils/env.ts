import { config } from 'dotenv';

const envFile = process.env.TEST_ENV ? `.env.${process.env.TEST_ENV}` : '.env';
config({ path: envFile, quiet: true });

export const env = {
  baseURL:
    process.env.BASE_URL ??
    process.env.E2E_BASE_URL ??
    'https://dent-priwebt7.dental.org.il/',
  username: (process.env.APP_USERNAME ?? process.env.E2E_USERNAME)?.trim(),
  password: process.env.APP_PASSWORD ?? process.env.E2E_PASSWORD,
  provider: process.env.PROVIDER?.trim(),
  providerPassword: process.env.PROVIDAR_PASSWORD,
  branch: process.env.BRANCH?.trim(),
  customerId: process.env.CUSTOMER_ID?.trim(),
  treatmentName: process.env.TREATMENT_NAME?.trim(),
  skipSteps: Number(process.env.SKIP_STEPS ?? 0),
  name: process.env.TEST_ENV ?? process.env.ENV_NAME ?? 'local',
};

export function requireEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
