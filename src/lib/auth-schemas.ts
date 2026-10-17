import { z } from "zod";

const email = z.email("Enter a valid email address");
const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name"),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
