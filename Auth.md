# Authentication Infrastructure for Viraltify V2

## Overview
This document provides a comprehensive guide for implementing secure authentication infrastructure for Viraltify V2. Following these guidelines will prevent common security vulnerabilities and ensure proper user management.

## 1. Supabase Project Configuration

### 1.1 Initial Setup
```bash
# Create new Supabase project
supabase init
supabase start
```

### 1.2 Authentication Settings (CRITICAL)
Configure these settings in Supabase Dashboard → Authentication:

**URL Configuration:**
- Site URL: `https://your-domain.com` (production) or `http://localhost:3000` (development)
- Redirect URLs: Add all valid domains where auth callbacks will be handled

**Password Security:**
- ✅ Enable "Leaked Password Protection"
- ✅ Set minimum password length: 8 characters
- ✅ Require uppercase, lowercase, numbers, and special characters

**Email Templates:**
- Customize confirmation and reset password templates
- Ensure redirect URLs point to your application

## 2. Database Schema & Security

### 2.1 User Profiles Table
```sql
-- Create profiles table with proper security
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Security constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Enable RLS (CRITICAL)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

### 2.2 Auto-Profile Creation Trigger
```sql
-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2.3 Security Audit Logging
```sql
-- Create security audit table
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Security definer function for logging
CREATE OR REPLACE FUNCTION public.log_security_event(
  action_type_param TEXT,
  resource_type_param TEXT,
  resource_id_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action_type, resource_type, resource_id, metadata
  ) VALUES (
    auth.uid(), action_type_param, resource_type_param, 
    resource_id_param, metadata_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 3. Frontend Authentication Implementation

### 3.1 Supabase Client Configuration
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
```

### 3.2 Authentication Context (CRITICAL IMPLEMENTATION)
```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // CRITICAL: Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', { event, userId: session?.user?.id })
        
        if (!mounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Log security events
        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to prevent auth callback deadlock
          setTimeout(() => {
            supabase.functions.invoke('log-security-event', {
              body: { 
                action: 'user_signin',
                resource_type: 'auth',
                metadata: { login_method: 'email' }
              }
            }).catch(console.error)
          }, 0)
        }
      }
    )

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }
        
        if (!mounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

### 3.3 Input Validation & Security
```typescript
// src/lib/security.ts
import { z } from 'zod'

// XSS Protection
export const sanitizeInput = (input: string): string => {
  if (!input) return ''
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

// Validation schemas
export const authValidationSchemas = {
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email must be less than 254 characters'),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
    
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .refine((name) => sanitizeInput(name) === name, 'Full name contains invalid characters')
}

// Secure validation helper
export const validateAndSanitize = <T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(', ') 
      }
    }
    return { success: false, error: 'Validation failed' }
  }
}
```

### 3.4 Secure Authentication Forms
```typescript
// src/components/auth/AuthPage.tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { authValidationSchemas, validateAndSanitize } from '@/lib/security'

export const AuthPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authAttempts, setAuthAttempts] = useState(0)
  const [rateLimited, setRateLimited] = useState(false)
  
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Rate limiting
  useEffect(() => {
    if (authAttempts >= 5) {
      setRateLimited(true)
      const timer = setTimeout(() => {
        setRateLimited(false)
        setAuthAttempts(0)
      }, 15 * 60 * 1000) // 15 minutes
      
      return () => clearTimeout(timer)
    }
  }, [authAttempts])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rateLimited) {
      toast({
        title: "Rate Limited",
        description: "Too many attempts. Please wait 15 minutes.",
        variant: "destructive"
      })
      return
    }

    // Validate inputs
    const emailValidation = validateAndSanitize(email, authValidationSchemas.email)
    if (!emailValidation.success) {
      toast({
        title: "Invalid Email",
        description: emailValidation.error,
        variant: "destructive"
      })
      return
    }

    if (isSignUp) {
      const passwordValidation = validateAndSanitize(password, authValidationSchemas.password)
      if (!passwordValidation.success) {
        toast({
          title: "Invalid Password",
          description: passwordValidation.error,
          variant: "destructive"
        })
        return
      }
    }

    try {
      setLoading(true)
      setAuthAttempts(prev => prev + 1)

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: emailValidation.data,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })

        if (error) throw error

        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link.",
        })
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          }
        })

        if (error) throw error
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast({
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? 'Sign up for Viraltify' : 'Welcome back to Viraltify'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          {isSignUp && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || rateLimited}
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Continue with Google')}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 3.5 Protected Routes
```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4 p-6 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <>{children}</>
}
```

### 3.6 Auth Callback Handler
```typescript
// src/pages/AuthCallback.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export const AuthCallback = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) throw error

        if (data.session) {
          toast({
            title: "Welcome!",
            description: "Successfully signed in.",
          })
          navigate('/dashboard')
        } else {
          const { data: authData, error: authError } = await supabase.auth.getUser()
          
          if (authError) throw authError

          if (authData.user) {
            toast({
              title: "Email verified!",
              description: "Please sign in to continue.",
            })
          }
          
          navigate('/auth')
        }
      } catch (error: any) {
        console.error('Auth callback error:', error)
        toast({
          title: "Authentication failed",
          description: error.message || "Please try signing in again.",
          variant: "destructive",
        })
        navigate('/auth')
      }
    }

    handleAuthCallback()
  }, [navigate, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Verifying your account...</h2>
        <p className="text-muted-foreground">Please wait while we sign you in.</p>
      </div>
    </div>
  )
}
```

## 4. Edge Functions Security

### 4.1 Security Headers Template
```typescript
// Security headers for all edge functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
}

// Apply to all responses
return new Response(JSON.stringify(result), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders,
  },
})
```

### 4.2 Authentication Verification
```typescript
// Verify user authentication in edge functions
const getAuthenticatedUser = async (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('No authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid authentication')
  }
  
  return user
}
```

## 5. Security Checklist

### ✅ Database Security
- [ ] RLS enabled on all tables
- [ ] Proper foreign key constraints
- [ ] Security definer functions for cross-table queries  
- [ ] Audit logging implemented
- [ ] Input validation at database level

### ✅ Authentication Security
- [ ] Leaked password protection enabled
- [ ] Strong password requirements
- [ ] Rate limiting implemented
- [ ] Proper session management
- [ ] Secure redirect URLs configured

### ✅ Frontend Security
- [ ] Input sanitization on all forms
- [ ] XSS protection implemented
- [ ] CSRF protection via Supabase tokens
- [ ] Secure storage of sensitive data
- [ ] Protected routes implemented

### ✅ API Security
- [ ] Authentication verification on all endpoints
- [ ] Input validation on all parameters
- [ ] Security headers on all responses
- [ ] Rate limiting on sensitive operations
- [ ] Proper error handling without information leakage

## 6. Monitoring & Maintenance

### 6.1 Security Monitoring
- Monitor authentication failures
- Track unusual access patterns
- Alert on multiple failed login attempts
- Log all administrative actions

### 6.2 Regular Security Audits
- Review RLS policies quarterly
- Update dependencies regularly
- Scan for vulnerabilities
- Test authentication flows

### 6.3 Incident Response Plan
- Document breach response procedures
- Maintain contact list for security incidents
- Regular backup and recovery testing
- User notification procedures

## 7. Common Security Pitfalls to Avoid

1. **Never store sensitive data in localStorage without encryption**
2. **Always validate and sanitize user input**
3. **Don't rely on client-side validation alone**
4. **Never expose service role keys in client code**
5. **Always use HTTPS in production**
6. **Don't trust data from URL parameters without validation**
7. **Implement proper error handling without exposing system details**
8. **Never use `dangerouslySetInnerHTML` without sanitization**
9. **Always implement rate limiting on auth endpoints**
10. **Don't forget to enable RLS on new tables**

---

## Implementation Priority

1. **Phase 1 (Week 1)**: Database schema and RLS policies
2. **Phase 2 (Week 2)**: Authentication context and protected routes  
3. **Phase 3 (Week 3)**: Secure forms and input validation
4. **Phase 4 (Week 4)**: Edge function security and monitoring
5. **Phase 5 (Week 5)**: Security testing and audit

Following this guide will create a robust, secure authentication system that prevents common vulnerabilities and provides a solid foundation for Viraltify V2.