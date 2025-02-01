interface RequestOptions extends RequestInit {
    skipAuth?: boolean;
}

export const apiClient = async (endpoint: string, options: RequestOptions = {}) => {
    try {
        const { skipAuth = false, headers = {}, ...rest } = options;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && !skipAuth && { 'Authorization': `Bearer ${token}` }),
            ...headers,
        };

        const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: defaultHeaders,
            credentials: 'include',
            ...rest,
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Expected JSON response but received ${contentType}`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Client Error:', {
            error,
            endpoint,
            options
        });
        
        if (error instanceof Error) {
            throw new Error(`API request failed: ${error.message}`);
        }
        throw new Error('API request failed');
    }
};
