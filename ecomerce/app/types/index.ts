export interface RegisterData {
    name: string;
    lastname: string;
    email: string;
    password: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface LoginData {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface LoginResponse {
    accessToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePic?: string;
}

export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
}

export interface PasswordChangeResponse {
    success: boolean;
    message: string;
}
