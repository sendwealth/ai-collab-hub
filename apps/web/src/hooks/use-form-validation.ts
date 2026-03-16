import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

export interface FieldConfig {
  rules: ValidationRule[];
}

export interface FormConfig {
  [fieldName: string]: FieldConfig;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  config: FormConfig
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (name: string, value: any): string => {
      const fieldConfig = config[name];
      if (!fieldConfig) return '';

      for (const rule of fieldConfig.rules) {
        // Required validation
        if (rule.required && (!value || value.toString().trim() === '')) {
          return rule.message;
        }

        // Skip other validations if field is empty and not required
        if (!value || value.toString().trim() === '') continue;

        // MinLength validation
        if (rule.minLength && value.length < rule.minLength) {
          return rule.message;
        }

        // MaxLength validation
        if (rule.maxLength && value.length > rule.maxLength) {
          return rule.message;
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
          return rule.message;
        }

        // Custom validation
        if (rule.custom && !rule.custom(value)) {
          return rule.message;
        }
      }

      return '';
    },
    [config]
  );

  const handleChange = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Only validate if field has been touched
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (name: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name]);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    },
    [values, validateField]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    for (const fieldName in config) {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    for (const fieldName in config) {
      allTouched[fieldName] = true;
    }
    setTouched(allTouched);

    return isValid;
  }, [values, config, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setFieldValue,
    setFieldError,
    setValues,
  };
}
