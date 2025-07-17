export interface Service {
    id: string;
    name: string;
    price: number;
    duration: string;
    description: string;
    icon: string;
}

export interface TimeSlot {
    time: string;
    available: boolean;
}

export interface CustomerInfo {
    name: string;
    phone: string;
    email: string;
    notes: string;
}
