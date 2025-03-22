export interface RegisterData {
    name: string;
    lastname: string;
    email: string;
    password: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    requireOTP?: boolean;
    data?: T;
    error?: string;
}

export interface LoginData {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface LoginResponse extends ApiResponse {
    accessToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    requireOTP?: boolean;
    data?: {
        accessToken: string;
        user: User;
    };
}

export interface User {
    id: number;
    name: string;
    lastname: string;
    email: string;
    role: string;
    profilePic?: string;
    device?: string;
    phone_number?: string;
    address?: string;
    city?: string;
    verified?: boolean;
}

export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
}

export interface PasswordChangeResponse {
    success: boolean;
    message: string;
}

declare global {
    interface Window {
        google?: {
            accounts?: {
                id?: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, options: any) => void;
                    prompt: () => void;
                    revoke: (email: string, callback: () => void) => void;
                };
            };
        };
    }
}

export interface GoogleResponse {
    credential: string;
    select_by: string;
}


export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    total_price: number;
    product?: {
        id: number;
        product_name: string;
        product_primary_image: string;
        product_price: number;
    };
}

export interface Order {
    id: number;
    order_number: string;
    user_id: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total_amount: number;
    payment_method: string;
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
    createdAt: string;
    updatedAt: string;
    shipping_address: string;
    shipping_city: string;
    shipping_postal_code: string;
    shipping_country: string;
    contact_phone: string;
    contact_email: string;
    tracking_number?: string;
    estimated_delivery_date?: string;
    user: {
        id: number;
        name: string;
        email: string;
        phone_number?: string;
    };
    items: OrderItem[];
}

export interface OrdersResponse {
    success: boolean;
    data: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        orders: Order[];
    };
}

export interface Career {
    id: number;
    title: string;
    description: string;
    location: string;
    salary?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

export interface CareerApplication {
    id: number;
    career_id: number;
    name: string;
    email: string;
    phone: string;
    resume?: string;
    cover_letter?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    career?: {
        title: string;
        location: string;
        description?: string;
    };
}

export interface CareerStats {
    careers: {
        total: number;
        active: number;
        inactive: number;
    };
    applications: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
}

export interface CareersResponse {
    success: boolean;
    data: Career[];
    total: number;
    page: number;
    totalPages: number;
}

export interface CareerApplicationsResponse {
    success: boolean;
    data: CareerApplication[];
    total: number;
    page: number;
    totalPages: number;
}