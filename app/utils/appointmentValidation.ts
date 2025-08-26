// src/utils/appointmentValidation.ts

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export interface CustomerInfo {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
}

export interface AppointmentBookingData {
    pet_id?: string;
    service_id?: string;
    appointment_date: string;
    appointment_time: string;
    customerInfo: CustomerInfo;
}

export class AppointmentValidator {

    // Validate customer info
    static validateCustomerInfo(customerInfo: CustomerInfo): ValidationResult {
        const errors: ValidationError[] = [];

        // Validate name
        if (!customerInfo.name || customerInfo.name.trim() === '') {
            errors.push({ field: 'name', message: 'Tên khách hàng là bắt buộc' });
        } else if (customerInfo.name.trim().length < 2) {
            errors.push({ field: 'name', message: 'Tên khách hàng phải có ít nhất 2 ký tự' });
        } else if (customerInfo.name.trim().length > 50) {
            errors.push({ field: 'name', message: 'Tên khách hàng không được vượt quá 50 ký tự' });
        }

        // Validate phone
        if (!customerInfo.phone || customerInfo.phone.trim() === '') {
            errors.push({ field: 'phone', message: 'Số điện thoại là bắt buộc' });
        } else if (!/^[0-9+\-\s()]{10,15}$/.test(customerInfo.phone.trim())) {
            errors.push({
                field: 'phone',
                message: 'Số điện thoại không hợp lệ (10-15 số)'
            });
        }

        // Validate email (optional)
        if (customerInfo.email && customerInfo.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerInfo.email.trim())) {
                errors.push({
                    field: 'email',
                    message: 'Email không hợp lệ'
                });
            }
        }

        // Validate notes (optional)
        if (customerInfo.notes && customerInfo.notes.length > 300) {
            errors.push({
                field: 'notes',
                message: 'Ghi chú không được vượt quá 300 ký tự'
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate appointment date
    static validateAppointmentDate(appointmentDate: string): ValidationResult {
        const errors: ValidationError[] = [];

        if (!appointmentDate || appointmentDate.trim() === '') {
            errors.push({ field: 'appointment_date', message: 'Ngày hẹn là bắt buộc' });
            return { isValid: false, errors };
        }

        // Convert DD/MM/YYYY to YYYY-MM-DD for validation
        const dateParts = appointmentDate.split('/');
        if (dateParts.length !== 3) {
            errors.push({ field: 'appointment_date', message: 'Định dạng ngày không hợp lệ (DD/MM/YYYY)' });
            return { isValid: false, errors };
        }

        const apiDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
        const selectedDate = new Date(apiDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(selectedDate.getTime())) {
            errors.push({ field: 'appointment_date', message: 'Định dạng ngày không hợp lệ' });
        } else if (selectedDate < today) {
            errors.push({ field: 'appointment_date', message: 'Ngày hẹn không được là ngày trong quá khứ' });
        } else {
            // Check if appointment is within next 3 months
            const maxDate = new Date();
            maxDate.setMonth(maxDate.getMonth() + 3);
            if (selectedDate > maxDate) {
                errors.push({ field: 'appointment_date', message: 'Ngày hẹn không được quá 3 tháng từ hôm nay' });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate appointment time
    static validateAppointmentTime(appointmentTime: string): ValidationResult {
        const errors: ValidationError[] = [];

        if (!appointmentTime || appointmentTime.trim() === '') {
            errors.push({ field: 'appointment_time', message: 'Giờ hẹn là bắt buộc' });
            return { isValid: false, errors };
        }

        // Check time format (HH:MM)
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(appointmentTime)) {
            errors.push({ field: 'appointment_time', message: 'Định dạng giờ không hợp lệ (HH:MM)' });
            return { isValid: false, errors };
        }

        // Check business hours (8:00 - 18:00)
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        const startTime = 8 * 60; // 8:00 AM
        const endTime = 18 * 60;  // 6:00 PM

        if (timeInMinutes < startTime || timeInMinutes >= endTime) {
            errors.push({
                field: 'appointment_time',
                message: 'Giờ hẹn phải trong khoảng 08:00 - 18:00'
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate complete appointment booking
    static validateAppointmentBooking(bookingData: AppointmentBookingData): ValidationResult {
        const errors: ValidationError[] = [];

        // Validate required fields
        if (!bookingData.pet_id) {
            errors.push({ field: 'pet_id', message: 'Vui lòng chọn thú cưng' });
        }

        if (!bookingData.service_id) {
            errors.push({ field: 'service_id', message: 'Vui lòng chọn dịch vụ' });
        }

        // Validate date
        const dateValidation = this.validateAppointmentDate(bookingData.appointment_date);
        if (!dateValidation.isValid) {
            errors.push(...dateValidation.errors);
        }

        // Validate time
        const timeValidation = this.validateAppointmentTime(bookingData.appointment_time);
        if (!timeValidation.isValid) {
            errors.push(...timeValidation.errors);
        }

        // Validate customer info
        const customerValidation = this.validateCustomerInfo(bookingData.customerInfo);
        if (!customerValidation.isValid) {
            errors.push(...customerValidation.errors);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Check if appointment is in past (date + time combined)
    static isAppointmentInPast(appointmentDate: string, appointmentTime: string): boolean {
        if (!appointmentDate || !appointmentTime) return true;

        try {
            // Convert DD/MM/YYYY to YYYY-MM-DD
            const dateParts = appointmentDate.split('/');
            const apiDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

            const appointmentDateTime = new Date(`${apiDate}T${appointmentTime}:00`);
            const now = new Date();

            return appointmentDateTime <= now;
        } catch (error) {
            return true; // If parsing fails, consider it invalid (past)
        }
    }

    // Get user-friendly error message
    static getErrorMessage(errors: ValidationError[]): string {
        if (errors.length === 0) return '';
        if (errors.length === 1) return errors[0].message;

        return `Có ${errors.length} lỗi cần khắc phục:\n${errors.map(e => `• ${e.message}`).join('\n')}`;
    }

    // Get errors by field
    static getErrorsByField(errors: ValidationError[]): Record<string, string[]> {
        const errorsByField: Record<string, string[]> = {};

        errors.forEach(error => {
            if (!errorsByField[error.field]) {
                errorsByField[error.field] = [];
            }
            errorsByField[error.field].push(error.message);
        });

        return errorsByField;
    }
}