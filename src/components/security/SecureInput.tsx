import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { sanitizeInput, validateAndSanitize, contentValidationSchemas } from '@/lib/security';
import { z } from 'zod';

interface SecureInputProps {
  value: string;
  onChange: (value: string) => void;
  validationType: keyof typeof contentValidationSchemas;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  maxLength?: number;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  value,
  onChange,
  validationType,
  placeholder,
  multiline = false,
  className,
  maxLength
}) => {
  const [error, setError] = useState<string>('');
  const [isTouched, setIsTouched] = useState(false);

  const handleChange = useCallback((newValue: string) => {
    setIsTouched(true);
    
    // Sanitize input first
    const sanitized = sanitizeInput(newValue);
    
    // Validate with schema
    const schema = contentValidationSchemas[validationType];
    const validation = validateAndSanitize(sanitized, schema);
    
    if (validation.success) {
      setError('');
    } else {
      setError((validation as any).error);
    }
    
    // Always call onChange with sanitized value
    onChange(sanitized);
  }, [onChange, validationType]);

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="space-y-2">
      <InputComponent
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} ${error && isTouched ? 'border-destructive' : ''}`}
        maxLength={maxLength}
      />
      
      {error && isTouched && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {maxLength && (
        <div className="text-xs text-muted-foreground text-right">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

// Hook for secure form validation
export const useSecureForm = <T extends Record<string, any>>(
  initialValues: T,
  validationSchemas: Record<keyof T, z.ZodSchema>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    const sanitized = typeof value === 'string' ? sanitizeInput(value) : value;
    
    setValues(prev => ({ ...prev, [key]: sanitized }));
    
    // Validate single field
    const schema = validationSchemas[key];
    const validation = validateAndSanitize(sanitized, schema);
    
    setErrors(prev => ({
      ...prev,
      [key]: validation.success ? undefined : (validation as any).error
    }));
  }, [validationSchemas]);

  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.entries(validationSchemas).forEach(([key, schema]) => {
      const validation = validateAndSanitize(values[key as keyof T], schema);
      if (!validation.success) {
        newErrors[key as keyof T] = (validation as any).error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationSchemas]);

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void>
  ) => {
    setIsSubmitting(true);
    
    try {
      if (validateAll()) {
        await onSubmit(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAll]);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    validateAll,
    handleSubmit
  };
};