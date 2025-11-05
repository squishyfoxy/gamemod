import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(0).default(3000),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL cannot be empty when provided")
    .optional(),
  REDIS_URL: z.string().url().optional(),
  ADMIN_PASSWORD: z
    .string()
    .min(1, "ADMIN_PASSWORD must be provided for staff tooling")
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;
