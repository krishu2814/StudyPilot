import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("8000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("postgresql://studypilot:studypilot123@localhost:5432/studypilot_db?schema=public"),
  JWT_SECRET: z.string().default("studypilot_jwt_default_secret_key"),
  LLM_PROVIDER: z.enum(["gemini", "groq", "openai"]).default("gemini"),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
