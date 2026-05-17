/**
 * Shared Zod validation schemas for all forms.
 * Import these in form components to replace inline regex / string checks.
 */

import { z } from 'zod';

// ─── Common fields ────────────────────────────────────────────────────────────

const emailField = z.string().email('Please enter a valid email address').toLowerCase();

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number');

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^\w+$/, 'Username can only contain letters, numbers, and underscores'),
  email: emailField,
  password: passwordField,
  confirmPassword: z.string(),
  dob: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((d) => {
      const age = (Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 13;
    }, 'You must be at least 13 years old to register'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
export type RegisterFormData = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});
export type OtpFormData = z.infer<typeof otpSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must differ from current password',
    path: ['newPassword'],
  });
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ─── Profile ──────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// ─── Marketplace ──────────────────────────────────────────────────────────────

export const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  type: z.enum(['for_sale', 'licensing', 'adaptation_rights', 'commission']),
  price: z.number().positive('Price must be positive'),
  currency: z.literal('USD').default('USD'),
});
export type CreateListingFormData = z.infer<typeof createListingSchema>;

export const createOfferSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  message: z.string().max(1000).optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});
export type CreateOfferFormData = z.infer<typeof createOfferSchema>;
