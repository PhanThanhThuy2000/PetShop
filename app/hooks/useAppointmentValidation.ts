// src/hooks/useAppointmentValidation.ts
import { useCallback, useMemo, useState } from 'react';
import {
    AppointmentBookingData,
    AppointmentValidator,
    ValidationError
} from '../utils/appointmentValidation';

interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    message: string;
}

interface ValidationState {
    [fieldName: string]: string[];
}

export const useAppointmentValidation = () => {
    const [validationErrors, setValidationErrors] = useState<ValidationState>({});
    const [isValidating, setIsValidating] = useState<boolean>(false);

    // Clear specific field error
    const clearFieldError = useCallback((fieldName: string): void => {
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    // Clear all errors
    const clearAllErrors = useCallback((): void => {
        setValidationErrors({});
    }, []);

    // Set field error
    const setFieldError = useCallback((fieldName: string, message: string): void => {
        setValidationErrors(prev => ({
            ...prev,
            [fieldName]: [message]
        }));
    }, []);

    // Validate customer name
    const validateCustomerName = useCallback((name: string): boolean => {
        const validation = AppointmentValidator.validateCustomerInfo({
            name: name || '',
            phone: '0123456789' // dummy phone for validation
        });

        const nameErrors = validation.errors.filter(error => error.field === 'name');

        if (nameErrors.length > 0) {
            setFieldError('name', nameErrors[0].message);
            return false;
        } else {
            clearFieldError('name');
            return true;
        }
    }, [setFieldError, clearFieldError]);

    // Validate customer phone
    const validateCustomerPhone = useCallback((phone: string): boolean => {
        const validation = AppointmentValidator.validateCustomerInfo({
            name: 'Test User', // dummy name for validation
            phone: phone || ''
        });

        const phoneErrors = validation.errors.filter(error => error.field === 'phone');

        if (phoneErrors.length > 0) {
            setFieldError('phone', phoneErrors[0].message);
            return false;
        } else {
            clearFieldError('phone');
            return true;
        }
    }, [setFieldError, clearFieldError]);

    // Validate customer email
    const validateCustomerEmail = useCallback((email: string): boolean => {
        if (!email || email.trim() === '') {
            clearFieldError('email');
            return true; // Email is optional
        }

        const validation = AppointmentValidator.validateCustomerInfo({
            name: 'Test User', // dummy name for validation
            phone: '0123456789', // dummy phone for validation
            email: email
        });

        const emailErrors = validation.errors.filter(error => error.field === 'email');

        if (emailErrors.length > 0) {
            setFieldError('email', emailErrors[0].message);
            return false;
        } else {
            clearFieldError('email');
            return true;
        }
    }, [setFieldError, clearFieldError]);

    // Validate notes
    const validateNotes = useCallback((notes: string): boolean => {
        if (!notes || notes.trim() === '') {
            clearFieldError('notes');
            return true; // Notes are optional
        }

        const validation = AppointmentValidator.validateCustomerInfo({
            name: 'Test User',
            phone: '0123456789',
            notes: notes
        });

        const notesErrors = validation.errors.filter(error => error.field === 'notes');

        if (notesErrors.length > 0) {
            setFieldError('notes', notesErrors[0].message);
            return false;
        } else {
            clearFieldError('notes');
            return true;
        }
    }, [setFieldError, clearFieldError]);

    // Validate appointment date
    const validateDate = useCallback((date: string): boolean => {
        const validation = AppointmentValidator.validateAppointmentDate(date || '');

        if (!validation.isValid) {
            setFieldError('appointment_date', validation.errors[0].message);
            return false;
        } else {
            clearFieldError('appointment_date');
            return true;
        }
    }, [setFieldError, clearFieldError]);

    // Validate appointment time
    const validateTime = useCallback((time: string, date?: string): boolean => {
        const validation = AppointmentValidator.validateAppointmentTime(time || '');

        if (!validation.isValid) {
            setFieldError('appointment_time', validation.errors[0].message);
            return false;
        }

        // Additional check: is appointment in past?
        if (date && time && AppointmentValidator.isAppointmentInPast(date, time)) {
            setFieldError('appointment_time', 'Thời gian hẹn không được trong quá khứ');
            return false;
        }

        clearFieldError('appointment_time');
        return true;
    }, [setFieldError, clearFieldError]);

    // Validate complete booking
    const validateCompleteBooking = useCallback((bookingData: AppointmentBookingData): ValidationResult => {
        setIsValidating(true);

        const validation = AppointmentValidator.validateAppointmentBooking(bookingData);

        if (!validation.isValid) {
            const errorsByField = AppointmentValidator.getErrorsByField(validation.errors);
            setValidationErrors(errorsByField);
            setIsValidating(false);
            return {
                isValid: false,
                errors: validation.errors,
                message: AppointmentValidator.getErrorMessage(validation.errors)
            };
        }

        clearAllErrors();
        setIsValidating(false);
        return {
            isValid: true,
            errors: [],
            message: ''
        };
    }, [clearAllErrors]);

    // Check if field has errors
    const hasFieldError = useCallback((fieldName: string): boolean => {
        return validationErrors[fieldName] && validationErrors[fieldName].length > 0;
    }, [validationErrors]);

    // Get field error message
    const getFieldError = useCallback((fieldName: string): string => {
        if (hasFieldError(fieldName)) {
            return validationErrors[fieldName][0];
        }
        return '';
    }, [validationErrors, hasFieldError]);

    // Check if form has any errors
    const hasErrors = useMemo((): boolean => {
        return Object.keys(validationErrors).length > 0;
    }, [validationErrors]);

    // Get all error messages
    const getAllErrors = useMemo((): string[] => {
        const allErrors: string[] = [];
        Object.values(validationErrors).forEach(fieldErrors => {
            allErrors.push(...fieldErrors);
        });
        return allErrors;
    }, [validationErrors]);

    return {
        // State
        validationErrors,
        isValidating,
        hasErrors,

        // Field validation functions
        validateCustomerName,
        validateCustomerPhone,
        validateCustomerEmail,
        validateNotes,
        validateDate,
        validateTime,

        // Complete form validation
        validateCompleteBooking,

        // Error management
        clearFieldError,
        clearAllErrors,
        setFieldError,
        hasFieldError,
        getFieldError,
        getAllErrors,
    };
};