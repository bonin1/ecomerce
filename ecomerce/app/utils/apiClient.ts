interface RequestOptions extends RequestInit {
    skipAuth?: boolean;
}

export const apiClient = async (endpoint: string, options: RequestOptions = {}) => {
    try {
        const { skipAuth = false, headers = {}, ...rest } = options;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

        let token = null;
        if (typeof window !== 'undefined') {
            if (endpoint.startsWith('/admin') || endpoint.startsWith('/careers')) {
                token = localStorage.getItem('adminToken');
                if (token) {
                    document.cookie = `ls_admin_token=${token}; path=/; max-age=14400; SameSite=Strict`;
                }
                console.log('Using admin token for route:', endpoint);
            } else {
                token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
                
                if (token) {
                    document.cookie = `ls_user_token=${token}; path=/; max-age=86400; SameSite=Strict`;
                }
            }
        }

        const isFormData = options.body instanceof FormData;
        
        const defaultHeaders: HeadersInit = isFormData 
            ? { ...(token && !skipAuth && { 'Authorization': `Bearer ${token}` }), ...headers }
            : { 'Content-Type': 'application/json', ...(token && !skipAuth && { 'Authorization': `Bearer ${token}` }), ...headers };

        if (isFormData) {
            const formData = options.body as FormData;
            formData.forEach((value, key) => {
                if (value instanceof File) {
                    console.log(`${key}: File - ${value.name} (${value.size} bytes, type: ${value.type})`);
                } else {
                    console.log(`${key}: ${String(value)}`);
                }
            });
        }

        const fullUrl = `${baseUrl}${endpoint}`;
        
                
        try {
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
                let errorData;
                
                try {
                    errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
                    
                    // Enhanced error logging for debugging
                    console.error('Error response details:', {
                        status: response.status,
                        statusText: response.statusText,
                        data: errorData,
                        endpoint
                    });
                    
                    // Handle validation errors specially
                    if (errorData.errors && Array.isArray(errorData.errors)) {
                        const validationErrors = errorData.errors.map((err: any) => err.msg || err.message || String(err)).join(', ');
                        errorMessage = `Validation errors: ${validationErrors}`;
                    }
                    
                    // Redirect to login if authentication issue
                    if (response.status === 401 && typeof window !== 'undefined') {
                        if (endpoint.startsWith('/admin') || endpoint.startsWith('/careers')) {
                            // For admin routes, redirect to admin login
                            console.log('Authentication error on admin route - redirecting to login');
                            window.location.href = '/admin/login';
                        }
                    }
                    
                    // Return the full error response for better handling at the component level
                    return errorData;
                    
                } catch (parseError) {
                    errorMessage = `HTTP error! Status: ${response.status}: ${errorText}`;
                    console.error('Error response (raw):', errorText);
                }
                throw new Error(errorMessage);
            }
            
            if (contentType && contentType.includes('application/json')) {
                const jsonData = await response.json();
                return jsonData;
            }

            return { success: true };
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
                console.error('Network error - check if the server is running and CORS is configured correctly');
            }
            throw fetchError;
        }
    } catch (error) {
        console.error('API Client Error:', {
            error,
            endpoint
        });
        
        throw error;
    }
};
