'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterData } from '@/app/types';
import { googleLogin } from '@/app/API/auth/GoogleLogin';
import './register.scss';

interface RegisterFormProps {
    onSubmit: (data: RegisterData) => Promise<void>;
    error?: string;
    loading?: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, error, loading }) => {
    const router = useRouter();
    const [formData, setFormData] = useState<RegisterData & { confirmPassword: string }>({
        name: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({
        password: false,
        confirmPassword: false
    });
    const [passwordError, setPasswordError] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);

    useEffect(() => {
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            setPasswordError('Passwords do not match');
        } else {
            setPasswordError('');
        }
    }, [formData.password, formData.confirmPassword]);

    useEffect(() => {
        const initializeGoogleSignIn = () => {
            if (typeof window !== 'undefined' && window.google?.accounts?.id) {
                google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
                    callback: handleGoogleResponse,
                    context: 'signup'
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
                            text: "signup_with",
                            shape: "rectangular",
                            logo_alignment: "left"
                        }
                    );
                }
            }
        };

        initializeGoogleSignIn();
        
        return () => {
            const buttonElement = document.getElementById("googleSignInButton");
            if (buttonElement) {
                buttonElement.innerHTML = '';
            }
        };
    }, []);

    const handleGoogleResponse = async (response: google.accounts.id.CredentialResponse) => {
        setGoogleLoading(true);
        try {
            const result = await googleLogin(response.credential);
            if (result.success && result.data) {
                localStorage.setItem('user', JSON.stringify(result.data.user));
                router.push('/dashboard');
            } else {
                setGoogleError(result.message || 'Google authentication failed');
            }
        } catch (err) {
            console.error('Google auth error:', err);
            setGoogleError('Google authentication failed');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordError) return;
        await onSubmit(formData);
    };

    return (
        <div className="register-form-container">
            <div className="position-relative mb-4">
                <hr className="divider" />
                <span className="divider-text">or</span>
            </div>

            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="bi bi-exclamation-circle me-2"></i>
                        {error}
                        <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                )}

                <div className="row g-3 mb-3">
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">First Name</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light">
                                <i className="bi bi-person"></i>
                            </span>
                            <input
                                name="name"
                                type="text"
                                className="form-control"
                                placeholder="John"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">Last Name</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light">
                                <i className="bi bi-person"></i>
                            </span>
                            <input
                                name="lastname"
                                type="text"
                                className="form-control"
                                placeholder="Doe"
                                value={formData.lastname}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                </div>

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
                            type={showPassword.password ? "text" : "password"}
                            className="form-control"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            className="btn btn-light border"
                            onClick={() => togglePasswordVisibility('password')}
                        >
                            <i className={`bi bi-eye${showPassword.password ? '-slash' : ''}`}></i>
                        </button>
                    </div>
                    <div className="form-text">Must be at least 8 characters long</div>
                </div>

                <div className="mb-4">
                    <label className="form-label small fw-bold">Confirm Password</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light">
                            <i className="bi bi-lock"></i>
                        </span>
                        <input
                            name="confirmPassword"
                            type={showPassword.confirmPassword ? "text" : "password"}
                            className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            className="btn btn-light border"
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                        >
                            <i className={`bi bi-eye${showPassword.confirmPassword ? '-slash' : ''}`}></i>
                        </button>
                    </div>
                    {passwordError && (
                        <div className="password-mismatch-text">
                            <i className="bi bi-exclamation-circle-fill me-1"></i>
                            {passwordError}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 mb-3 fw-bold submit-button"
                    disabled={loading || !!passwordError}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Creating Account...
                        </>
                    ) : 'Create Account'}
                </button>
            </form>
            {googleError && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {googleError}
                    <button type="button" className="btn-close" data-bs-dismiss="alert" onClick={() => setGoogleError(null)}></button>
                </div>
            )}
            <div id="googleSignInButton" className="w-100 mb-3"></div>
            <div className="text-center">
                <span className="text-muted">Already have an account? </span>
                <Link href="/login" className="text-primary fw-bold text-decoration-none">
                    Sign in
                </Link>
            </div>
        </div>
    );
};

export default RegisterForm;
