import { apiClient } from '@/app/utils/apiClient';

export const updateProfile = async (data: any) => {
    try {
        const response = await apiClient('/api/profile/update', {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        return response;
    } catch (error) {
        console.error('Profile update error:', error);
        throw error;
    }
};

export const updateProfilePicture = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('profile_picture', file);

        const response = await apiClient('/api/profile/picture', {
            method: 'PUT',
            body: formData,
        });

        return response;
    } catch (error) {
        console.error('Profile picture update error:', error);
        throw error;
    }
};

export const deleteProfilePicture = async () => {
    try {
        const response = await apiClient('/api/profile/picture', {
            method: 'DELETE'
        });

        return response;
    } catch (error) {
        console.error('Profile picture delete error:', error);
        throw error;
    }
};

export const initiateEmailChange = async (newEmail: string) => {
    try {
        const response = await apiClient('/api/profile/email/verify', {
            method: 'POST',
            body: JSON.stringify({ newEmail })
        });

        return response;
    } catch (error) {
        console.error('Email change initiation error:', error);
        throw error;
    }
};

export const confirmEmailChange = async (token: string) => {
    try {
        const response = await apiClient(`/api/profile/email/confirm/${token}`, {
            method: 'POST'
        });

        return response;
    } catch (error) {
        console.error('Email change confirmation error:', error);
        throw error;
    }
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
        const response = await apiClient('/api/profile/password/change', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        return response;
    } catch (error) {
        console.error('Password change error:', error);
        throw error;
    }
};

export const deleteAccount = async () => {
    try {
        const response = await apiClient('/api/profile/delete', {
            method: 'DELETE'
        });

        return response;
    } catch (error) {
        console.error('Account deletion error:', error);
        throw error;
    }
};

export const reactivateAccount = async () => {
    try {
        const response = await apiClient('/api/profile/reactivate', {
            method: 'POST'
        });

        return response;
    } catch (error) {
        console.error('Account reactivation error:', error);
        throw error;
    }
};

export const getActivityHistory = async (page = 1, limit = 10) => {
    try {
        const response = await apiClient(`/api/profile/activity?page=${page}&limit=${limit}`, {
            method: 'GET'
        });

        return response;
    } catch (error) {
        console.error('Activity history error:', error);
        throw error;
    }
};
