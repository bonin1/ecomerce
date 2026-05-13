
import { apiClient } from '@/app/utils/apiClient';

export const verifyEmailChange = async (token: string) => {
    try {
        const response = await apiClient(`/api/profile/email/confirm/${token}`, {
            method: 'POST'
        });
        return response;
    } catch (error) {
        console.error('Email verification error:', error);
        throw error;
    }
};