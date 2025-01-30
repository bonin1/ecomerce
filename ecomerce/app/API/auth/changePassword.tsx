import { PasswordChangeData, ApiResponse } from '@/app/types';

export const changePassword = async (passwordData: PasswordChangeData): Promise<ApiResponse> => {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(passwordData),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to change password'
        };
    }
};
