import { ApiResponse, LoginResponse } from '@/app/types';

export const verifyOTP = async (email: string, otp: string): Promise<ApiResponse<LoginResponse>> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, otp }),
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'OTP verification failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'OTP verification failed',
        };
    }
};
