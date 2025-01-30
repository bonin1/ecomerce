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
