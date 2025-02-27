import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(7, { message: 'Password must be atleast 7 characters' }),
});

export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3, { message: 'Username must be atleast 3 characters' })
    .max(16, { message: 'Username must be at most 16 characters' }),
});

export const verifySchema = z.bigint();
