import { ApiResponse, LoginResponse } from '@/app/types';

export const googleLogin = async (token: string): Promise<ApiResponse<LoginResponse>> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ token }),
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Google authentication failed');
        }

        return await response.json();
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Google authentication failed',
        };
    }
};
