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

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'OTP verification failed');
        }

        if (data.success && data.data?.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
            localStorage.setItem('user', JSON.stringify(data.data.user));
        }

        return data;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'OTP verification failed',
        };
    }
};
