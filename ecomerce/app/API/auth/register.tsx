import { RegisterData, ApiResponse } from '@/app/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const registerUser = async (data: RegisterData): Promise<ApiResponse> => {
    try {
        console.log('Sending request to:', `${API_URL}/auth/register`);
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'Registration failed');
        }

        return responseData;
    } catch (error) {
        console.error('Registration API Error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Registration failed',
        };
    }
};
