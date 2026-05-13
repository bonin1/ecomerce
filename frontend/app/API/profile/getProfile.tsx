import { apiClient } from '@/app/utils/apiClient';

export const getProfile = async () => {
    try {
        const response = await apiClient('/api/profile', {
            method: 'GET'
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch profile');
        }

        return response;
    } catch (error) {
        console.error('Profile fetch error:', error);
        throw error;
    }
};
