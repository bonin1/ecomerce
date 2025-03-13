import { LoginData, ApiResponse, LoginResponse } from '@/app/types';
import { dispatchUserLogin } from '@/app/utils/auth-events';

export const login = async (loginData: LoginData): Promise<ApiResponse<LoginResponse>> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(loginData),
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        if (data.success && data.data?.accessToken) {
            if (loginData.rememberMe) {
                localStorage.setItem('accessToken', data.data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                // Sync with cookie for middleware
                document.cookie = `ls_user_token=${data.data.accessToken}; path=/; max-age=${30*24*60*60}; SameSite=Strict`;
            } else {
                sessionStorage.setItem('accessToken', data.data.accessToken);
                sessionStorage.setItem('user', JSON.stringify(data.data.user));
                
                // Sync with cookie for middleware - session only
                document.cookie = `ls_user_token=${data.data.accessToken}; path=/; SameSite=Strict`;
            }
            
            dispatchUserLogin(data.data.user);
        }

        return data;
    } catch (error) {
        throw error;
    }
};
