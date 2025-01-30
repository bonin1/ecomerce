import { LoginData, ApiResponse, LoginResponse } from '@/app/types';

export const login = async (loginData: LoginData): Promise<ApiResponse<LoginResponse>> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            },
            body: JSON.stringify(loginData),
            credentials: 'include',
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            } catch {
                throw new Error(`Login failed: ${response.statusText}`);
            }
        }

        try {
            const data = await response.json();
            return data;
        } catch (parseError) {
            throw new Error('Invalid response from server');
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Login failed',
        };
    }
};
