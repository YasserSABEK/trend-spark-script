import { z } from 'zod';

/**
 * Security utilities for input validation and XSS protection
 */

// XSS Protection - Sanitize HTML content
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove script tags and dangerous HTML elements
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Content validation schemas
export const contentValidationSchemas = {
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .refine((title) => {
      const sanitized = sanitizeInput(title);
      return sanitized === title;
    }, 'Title contains invalid characters'),

  notes: z.string()
    .max(5000, 'Notes must be less than 5000 characters')
    .refine((notes) => {
      const sanitized = sanitizeInput(notes);
      return sanitized === notes;
    }, 'Notes contain invalid characters'),

  caption: z.string()
    .max(2500, 'Caption must be less than 2500 characters')
    .refine((caption) => {
      const sanitized = sanitizeInput(caption);
      return sanitized === caption;
    }, 'Caption contains invalid characters'),

  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),

  displayName: z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters')
    .refine((name) => {
      const sanitized = sanitizeInput(name);
      return sanitized === name;
    }, 'Display name contains invalid characters'),

  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email must be less than 254 characters'),

  url: z.string()
    .url('Invalid URL format')
    .refine((url) => {
      // Only allow HTTPS URLs for security
      return url.startsWith('https://');
    }, 'Only HTTPS URLs are allowed')
};

// Rate limiting utilities
export const rateLimitKeys = {
  contentCreation: (userId: string) => `content_creation:${userId}`,
  scriptGeneration: (userId: string) => `script_generation:${userId}`,
  authentication: (ip: string) => `auth_attempt:${ip}`,
};

// Secure password generation (replacing predictable patterns)
export const generateSecurePassword = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
};

// Input validation helper
export const validateAndSanitize = <T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(', ') 
      };
    }
    return { success: false, error: 'Validation failed' };
  }
};

// Security headers for API responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://siafgzfpzowztfhlajtn.supabase.co;",
};

// Audit logging helper
export const logSecurityEvent = (
  eventType: string,
  details: Record<string, any>
) => {
  console.log(`[SECURITY] ${eventType}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};