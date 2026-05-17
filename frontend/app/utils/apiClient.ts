import { isAdminDiagnosticsRoute, pushAdminDiagnostic } from '@/app/admin/adminDiagnosticsBus';

interface RequestOptions extends RequestInit {
    skipAuth?: boolean;
}

const isDev = process.env.NODE_ENV === 'development';

function getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
}

/** Keep Bearer header in sync with what the backend may also accept via httpOnly cookies. */
function persistUserAccessToken(accessToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('accessToken', accessToken);
    document.cookie = `ls_user_token=${accessToken}; path=/; max-age=${24 * 60 * 60}; SameSite=Strict`;
}

function clearUserAuthClient() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    document.cookie = 'ls_user_token=; path=/; max-age=0';
}

let refreshMutex: Promise<boolean> | null = null;

/**
 * Uses httpOnly refresh cookie + optional legacy remember-me cookie (POST /auth/refresh).
 */
async function tryRefreshUserSession(): Promise<boolean> {
    if (refreshMutex) return refreshMutex;

    const run = async (): Promise<boolean> => {
        try {
            const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });
            const data = (await res.json().catch(() => ({}))) as {
                success?: boolean;
                data?: { accessToken?: string };
            };
            if (!res.ok || !data.success || !data.data?.accessToken) {
                return false;
            }
            persistUserAccessToken(data.data.accessToken);
            return true;
        } catch {
            return false;
        }
    };

    refreshMutex = run().finally(() => {
        refreshMutex = null;
    });
    return refreshMutex;
}

/** Requests that should use the admin-panel JWT when it is present (staff/admin/superadmin). */
function prefersAdminBearer(endpoint: string): boolean {
    if (endpoint.startsWith('/admin') || endpoint.startsWith('/careers')) return true;
    if (endpoint.startsWith('/reviews/admin')) return true;
    if (endpoint.startsWith('/affiliate/admin')) return true;
    if (endpoint.startsWith('/payment-methods')) return true;
    if (endpoint.startsWith('/product/')) return true;
    return false;
}

function getAuthToken(endpoint: string, skipAuth: boolean): string | null {
    if (typeof window === 'undefined' || skipAuth) return null;
    const adminToken = localStorage.getItem('adminToken');
    if (prefersAdminBearer(endpoint) && adminToken) {
        return adminToken;
    }
    if (endpoint.startsWith('/admin') || endpoint.startsWith('/careers')) {
        return adminToken;
    }
    return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

function buildHeaders(
    endpoint: string,
    skipAuth: boolean,
    extra: HeadersInit,
    isFormData: boolean
): HeadersInit {
    const token = getAuthToken(endpoint, skipAuth);
    if (prefersAdminBearer(endpoint) || endpoint.startsWith('/admin') || endpoint.startsWith('/careers')) {
        if (token) {
            document.cookie = `ls_admin_token=${token}; path=/; max-age=14400; SameSite=Strict`;
        }
    } else if (token) {
        document.cookie = `ls_user_token=${token}; path=/; max-age=86400; SameSite=Strict`;
    }

    if (isFormData) {
        return { ...(token && !skipAuth && { Authorization: `Bearer ${token}` }), ...extra };
    }
    return {
        'Content-Type': 'application/json',
        ...(token && !skipAuth && { Authorization: `Bearer ${token}` }),
        ...extra,
    };
}

const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/google-auth', '/auth/logout'];

/** JSON body shape returned by most API routes (additional keys are allowed). */
export type ApiClientJson<D = any> = {
    success?: boolean;
    message?: string;
    data?: D;
    errors?: unknown;
    totalPages?: number;
    /** Some legacy routes use a string status instead of `success`. */
    status?: string;
    /** Wishlist status route may include this on the root object. */
    inWishlist?: boolean;
};

function shouldTryRefreshOn401(endpoint: string, skipAuth: boolean): boolean {
    if (skipAuth) return false;
    if (endpoint.startsWith('/admin') || endpoint.startsWith('/careers')) return false;
    if (endpoint.startsWith('/reviews/admin') || endpoint.startsWith('/affiliate/admin')) return false;
    if (endpoint.startsWith('/payment-methods')) return false;
    if (typeof window !== 'undefined' && localStorage.getItem('adminToken') && endpoint.startsWith('/product/')) {
        return false;
    }
    return !NO_REFRESH_PATHS.some((p) => endpoint === p || endpoint.startsWith(`${p}?`));
}

export const apiClient = async <D = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<ApiClientJson<D>> => {
    const baseUrl = getBaseUrl();
    const { skipAuth = false, headers = {}, ...rest } = options;
    const isFormData = options.body instanceof FormData;

    const execute = async (isRetryAfterRefresh: boolean): Promise<ApiClientJson<D>> => {
        const defaultHeaders = buildHeaders(endpoint, skipAuth, headers, isFormData);

        if (isDev && isFormData && options.body instanceof FormData) {
            const formData = options.body;
            formData.forEach((value, key) => {
                if (value instanceof File) {
                    if (isDev) {
                        console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
                    }
                }
            });
        }

        const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: defaultHeaders,
            credentials: 'include',
            ...rest,
        });

        const contentType = response.headers.get('content-type');

        if (!response.ok) {
            if (
                response.status === 401 &&
                shouldTryRefreshOn401(endpoint, skipAuth) &&
                !isRetryAfterRefresh
            ) {
                const refreshed = await tryRefreshUserSession();
                if (refreshed) {
                    return execute(true);
                }
                clearUserAuthClient();
                if (typeof window !== 'undefined') {
                    const path = window.location.pathname;
                    if (!path.startsWith('/login') && !path.startsWith('/register')) {
                        const next = encodeURIComponent(path + window.location.search);
                        window.dispatchEvent(new Event('user-logout'));
                        window.location.assign(`/login?next=${next}`);
                    }
                }
                return {
                    success: false,
                    message: 'Session expired. Please sign in again.',
                } as ApiClientJson<D>;
            }

            const errorText = await response.text();
            let errorMessage: string | undefined;
            let errorData: Record<string, unknown> | undefined;

            try {
                errorData = errorText ? (JSON.parse(errorText) as Record<string, unknown>) : undefined;
                errorMessage =
                    (typeof errorData?.message === 'string' && errorData.message) ||
                    `HTTP error! Status: ${response.status}`;

                if (isDev && errorData) {
                    console.warn('API error', { status: response.status, endpoint, data: errorData });
                }

                if (errorData?.errors && Array.isArray(errorData.errors)) {
                    const validationErrors = (errorData.errors as { msg?: string; message?: string }[])
                        .map((err) => err.msg || err.message || String(err))
                        .join(', ');
                    errorMessage = `Validation errors: ${validationErrors}`;
                }

                if (response.status === 401 && typeof window !== 'undefined') {
                    const adminCtx =
                        endpoint.startsWith('/admin') ||
                        endpoint.startsWith('/careers') ||
                        endpoint.startsWith('/reviews/admin') ||
                        endpoint.startsWith('/affiliate/admin') ||
                        endpoint.startsWith('/payment-methods') ||
                        (localStorage.getItem('adminToken') && endpoint.startsWith('/product/'));
                    if (adminCtx) {
                        window.location.href = '/admin/login';
                    }
                }

                return (errorData ?? { success: false, message: errorMessage }) as ApiClientJson<D>;
            } catch {
                errorMessage = `HTTP error! Status: ${response.status}: ${errorText}`;
                if (isDev) console.warn('API error (non-JSON)', { status: response.status, endpoint, errorText });
                throw new Error(errorMessage);
            }
        }

        if (contentType && contentType.includes('application/json')) {
            return (await response.json()) as ApiClientJson<D>;
        }

        return { success: true } as ApiClientJson<D>;
    };

    try {
        return await execute(false);
    } catch (error) {
        if (isDev) {
            console.error('API Client Error:', { error, endpoint });
        }
        if (typeof window !== 'undefined' && isAdminDiagnosticsRoute(window.location.pathname)) {
            const msg = error instanceof Error ? error.message : String(error);
            pushAdminDiagnostic({
                kind: 'network',
                message: `${endpoint}: ${msg}`,
                detail: error instanceof Error ? error.stack : undefined,
            });
            const friendly =
                msg === 'Failed to fetch' || /network/i.test(msg)
                    ? 'Request failed (often CORS, wrong API URL, or the backend is down). Check the diagnostics panel and server logs.'
                    : msg;
            return { success: false, message: friendly } as ApiClientJson<D>;
        }
        throw error;
    }
};
