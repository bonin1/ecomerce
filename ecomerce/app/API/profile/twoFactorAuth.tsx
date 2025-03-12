import { apiClient } from '@/app/utils/apiClient';

export const setupTwoFactorAuth = async () => {
    try {
        const response = await apiClient('/api/profile/2fa/setup', {
            method: 'POST'
        });

        return response;
    } catch (error) {
        console.error('2FA setup error:', error);
        throw error;
    }
};

export const verifyAndEnableTwoFactorAuth = async (token: string) => {
    try {
        const response = await apiClient('/api/profile/2fa/verify', {
            method: 'POST',
            body: JSON.stringify({ token })
        });

        return response;
    } catch (error) {
        console.error('2FA verification error:', error);
        throw error;
    }
};

export const disableTwoFactorAuth = async () => {
    try {
        const response = await apiClient('/api/profile/2fa/disable', {
            method: 'POST'
        });

        return response;
    } catch (error) {
        console.error('2FA disable error:', error);
        throw error;
    }
};

export const getTwoFactorAuthStatus = async () => {
    try {
        const response = await apiClient('/api/profile/2fa/status', {
            method: 'GET'
        });

        return response;
    } catch (error) {
        console.error('2FA status error:', error);
        throw error;
    }
};
