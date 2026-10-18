import { z } from "zod";

const githubEnvSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
});

export const githubEnv = githubEnvSchema.parse(process.env);
