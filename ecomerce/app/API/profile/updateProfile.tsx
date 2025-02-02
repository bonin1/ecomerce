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
