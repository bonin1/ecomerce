'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ForgotPasswordModal from '../auth/ForgotPasswordModal';
import './login.scss';
import { googleLogin } from '@/app/API/auth/GoogleLogin';

interface LoginData {
    email: string;
    password: string;
    rememberMe?: boolean;
}

interface LoginFormProps {
    onSubmit: (data: LoginData) => Promise<void>;
    loading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, loading }) => {
    const router = useRouter();
    const [formData, setFormData] = useState<LoginData>({
        email: '',
        password: '',
        rememberMe: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        const initializeGoogleSignIn = () => {
            if (typeof window !== 'undefined' && window.google?.accounts?.id) {
                google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
                    callback: handleGoogleResponse,
                    context: 'signin'
                });
                
                const buttonElement = document.getElementById("googleSignInButton");
                if (buttonElement) {
                    google.accounts.id.renderButton(
                        buttonElement,
                        { 
                            theme: "filled_blue",
                            size: "large",
                            width: "100%",
                            type: "standard",
                            text: "signin_with",
                            shape: "rectangular",
                            logo_alignment: "left"
                        }
                    );
                }
            }
        };

        initializeGoogleSignIn();
    }, []);

    const handleGoogleResponse = async (response: google.accounts.id.CredentialResponse) => {
        setGoogleLoading(true);
        try {
            const result = await googleLogin(response.credential);
            if (result.success && result.data) {
                localStorage.setItem('user', JSON.stringify(result.data.user));
                router.push('/profile');
            } else {
                toast.error(result.message || 'Google authentication failed');
            }
        } catch (err) {
            console.error('Google auth error:', err);
            toast.error('Google authentication failed');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({
            ...prev,
            [e.target.name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            if (message.includes('Please sign in with Google')) {
                toast.error('This email is registered with Google. Please use Google Sign-In.');
            } else {
                toast.error(message);
            }
        }
    };

    return (
        <div className="login-form-container">
            
            <div className="position-relative mb-4">
                <hr className="divider" />
                <span className="divider-text">or</span>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label small fw-bold">Email Address</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light">
                            <i className="bi bi-envelope"></i>
                        </span>
                        <input
                            name="email"
                            type="email"
                            className="form-control"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label small fw-bold">Password</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light">
                            <i className="bi bi-lock"></i>
                        </span>
                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            className="btn btn-light border"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="rememberMe"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                            />
                            <label className="form-check-label small" htmlFor="rememberMe">
                                Remember me
                            </label>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="text-primary small text-decoration-none border-0 bg-transparent"
                        >
                            Forgot password?
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 mb-3 fw-bold submit-button"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Signing in...
                        </>
                    ) : 'Sign In'}
                </button>
            </form>
            <div id="googleSignInButton" className="w-100 mb-3"></div>
            <div className="text-center">
                <span className="text-muted">Don't have an account? </span>
                <Link href="/register" className="text-primary fw-bold text-decoration-none">
                    Sign up
                </Link>
            </div>

            <ForgotPasswordModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default LoginForm;
