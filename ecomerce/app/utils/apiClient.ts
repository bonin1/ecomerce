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
        console.log('Fetching from:', fullUrl);
        console.log('Using token:', token ? 'Yes' : 'No');
        
        const response = await fetch(fullUrl, {
            headers: defaultHeaders,
            credentials: 'include', // This is crucial for cookies
            ...rest,
        });

        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
            } catch {
                errorMessage = `HTTP error! status: ${response.status}: ${errorText}`;
            }
            throw new Error(errorMessage);
        }
        
        if (contentType && contentType.includes('application/json')) {
            const jsonData = await response.json();
            // Log the structure to help with debugging
            console.log('API response structure:', {
                keys: Object.keys(jsonData),
                hasData: 'data' in jsonData,
                dataType: jsonData.data ? typeof jsonData.data : null,
                isArray: jsonData.data ? Array.isArray(jsonData.data) : null
            });
            return jsonData;
        }

        return { success: true };
    } catch (error) {
        console.error('API Client Error:', {
            error,
            endpoint,
            options
        });
        
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('API request failed');
    }
};
