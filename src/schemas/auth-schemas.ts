import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const registerSchema = z
  .object({
    email: z.string().email(),
    username: z
      .string()
      .min(3, { message: 'Username must be atleast 3 characters' })
      .max(16, { message: 'Username must be at most 16 characters' }),
    password: z
      .string()
      .min(7, { message: 'Password must be at least 7 characters' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[^A-Za-z0-9]/, {
        message: 'Password must contain at least one special character',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const verifySchema = z.object({
  code: z.string().min(6, { message: "Please enter all 6 digits" }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(7, { message: 'Password must be at least 7 characters' })
    .regex(/[A-Z]/, {
      message: 'Password must contain at least one uppercase letter',
    })
    .regex(/[a-z]/, {
      message: 'Password must contain at least one lowercase letter',
    })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, {
      message: 'Password must contain at least one special character',
    }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
