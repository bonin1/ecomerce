import { apiClient } from '@/app/utils/apiClient';

export const exportProfileData = async (formats: string[]) => {
    try {
        const response = await apiClient('/api/profile/export', {
            method: 'POST',
            body: JSON.stringify({ formats })
        });

        if (response.status === 'success' && response.data?.downloadUrl) {
            const link = document.createElement('a');
            link.href = response.data.downloadUrl;
            link.download = response.data.filename || 'profile-data.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        return response;
    } catch (error) {
        console.error('Error exporting profile data:', error);
        throw error;
    }
};
