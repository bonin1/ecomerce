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
