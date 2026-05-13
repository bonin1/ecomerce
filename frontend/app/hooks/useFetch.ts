import { useState } from 'react';
import { ApiResponse } from '../types';

export const useFetch = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async <T>(
        url: string, 
        options?: RequestInit
    ): Promise<ApiResponse<T> | null> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options,
            });

            const data: ApiResponse<T> = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { fetchData, loading, error };
};
