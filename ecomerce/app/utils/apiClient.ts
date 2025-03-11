interface RequestOptions extends RequestInit {
    skipAuth?: boolean;
}

export const apiClient = async (endpoint: string, options: RequestOptions = {}) => {
    try {
        const { skipAuth = false, headers = {}, ...rest } = options;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

        let token = null;
        if (typeof window !== 'undefined') {
            if (endpoint.startsWith('/admin')) {
                token = localStorage.getItem('adminToken');
                console.log('Using admin token for admin route:', endpoint);
            } else {
                token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
            }
        }

        const isFormData = options.body instanceof FormData;
        const defaultHeaders: HeadersInit = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token && !skipAuth && { 'Authorization': `Bearer ${token}` }),
            ...headers,
        };

        const fullUrl = `${baseUrl}${endpoint}`;
        
        const response = await fetch(fullUrl, {
            headers: defaultHeaders,
            credentials: 'include',
            ...rest,
        });

        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
                console.error('Error response:', errorData);
            } catch {
                errorMessage = `HTTP error! Status: ${response.status}: ${errorText}`;
                console.error('Error text:', errorText);
            }
            throw new Error(errorMessage);
        }
        
        if (contentType && contentType.includes('application/json')) {
            const jsonData = await response.json();
            return jsonData;
        }

        return { success: true };
    } catch (error) {
        console.error('API Client Error:', {
            error,
            endpoint
        });
        
        throw error;
    }
};
