'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import './reset-password.scss';

const ResetPasswordPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams?.get('token');
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);
    const [showPassword, setShowPassword] = useState({
        new: false,
        confirm: false
    });
    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenValid(false);
                setError('No reset token provided');
                return;
            }
            
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-reset-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    setTokenValid(false);
                    setError('This password reset link is invalid or has expired');
                }
            } catch (err) {
                setTokenValid(false);
                setError('Error verifying reset token');
            }
        };
        
        verifyToken();
    }, [token]);

    const checkPasswordStrength = (password: string) => {
        let strength = 0;
        
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        setPasswordStrength(strength);
    };

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const password = e.target.value;
        setNewPassword(password);
        checkPasswordStrength(password);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 3000);
            } else {
                throw new Error(data.message || 'Failed to reset password');
            }
        } catch (err: any) {
            setError(err.message || 'Error resetting password');
        } finally {
            setLoading(false);
        }
    };

    const getStrengthColor = () => {
        switch (passwordStrength) {
            case 0: return 'bg-danger';
            case 1: return 'bg-warning';
            case 2: return 'bg-info';
            case 3: return 'bg-primary';
            case 4: return 'bg-success';
            default: return 'bg-danger';
        }
    };

    const getStrengthText = () => {
        switch (passwordStrength) {
            case 0: return 'Very Weak';
            case 1: return 'Weak';
            case 2: return 'Medium';
            case 3: return 'Strong';
            case 4: return 'Very Strong';
            default: return 'Very Weak';
        }
    };

    if (!tokenValid) {
        return (
            <div className="reset-password-container">
                <div className="card shadow-sm">
                    <div className="card-body p-4 text-center">
                        <div className="mb-4">
                            <i className="bi bi-exclamation-triangle-fill text-warning invalid-token-icon"></i>
                        </div>
                        <h2 className="card-title mb-3">Invalid or Expired Link</h2>
                        <p className="card-text text-muted mb-4">
                            {error || 'The password reset link is invalid or has expired.'}
                        </p>
                        <Link href="/login" className="btn btn-primary">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-container">
            <div className="card shadow-sm">
                <div className="card-body p-4">
                    {success ? (
                        <div className="text-center">
                            <div className="mb-4">
                                <i className="bi bi-check-circle-fill text-success success-icon"></i>
                            </div>
                            <h2 className="card-title mb-3">Password Reset Success</h2>
                            <p className="card-text text-muted mb-4">
                                Your password has been successfully reset. You'll be redirected to the login page shortly.
                            </p>
                            <Link href="/login" className="btn btn-primary">
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="card-title mb-4">Reset Your Password</h2>
                            
                            {error && (
                                <div className="alert alert-danger mb-4">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {error}
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="newPassword" className="form-label">New Password</label>
                                    <div className="input-group">
                                        <input 
                                            type={showPassword.new ? "text" : "password"} 
                                            className="form-control" 
                                            id="newPassword"
                                            value={newPassword}
                                            onChange={handleNewPasswordChange}
                                            required
                                            minLength={8}
                                        />
                                        <button 
                                            className="btn btn-outline-secondary" 
                                            type="button"
                                            onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                                        >
                                            <i className={`bi bi-${showPassword.new ? 'eye-slash' : 'eye'}`}></i>
                                        </button>
                                    </div>
                                    
                                    <div className="password-strength mt-2">
                                        <div className="d-flex justify-content-between">
                                            <small>Password Strength:</small>
                                            <small className={`text-${passwordStrength >= 3 ? 'success' : passwordStrength === 2 ? 'info' : 'danger'}`}>
                                                {getStrengthText()}
                                            </small>
                                        </div>
                                        <div className="progress">
                                            <div 
                                                className={`progress-bar ${getStrengthColor()}`}
                                                role="progressbar" 
                                                style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                                aria-valuenow={(passwordStrength / 4) * 100}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    <div className="password-requirements mt-2">
                                        <small className="text-muted">
                                            Password requirements:
                                        </small>
                                        <ul className="small">
                                            <li className={newPassword.length >= 8 ? 'text-success' : ''}>
                                                <i className={`bi ${newPassword.length >= 8 ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                                                At least 8 characters
                                            </li>
                                            <li className={/[A-Z]/.test(newPassword) ? 'text-success' : ''}>
                                                <i className={`bi ${/[A-Z]/.test(newPassword) ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                                                One uppercase letter
                                            </li>
                                            <li className={/[0-9]/.test(newPassword) ? 'text-success' : ''}>
                                                <i className={`bi ${/[0-9]/.test(newPassword) ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                                                One number
                                            </li>
                                            <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-success' : ''}>
                                                <i className={`bi ${/[^A-Za-z0-9]/.test(newPassword) ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                                                One special character
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                                    <div className="input-group">
                                        <input 
                                            type={showPassword.confirm ? "text" : "password"} 
                                            className={`form-control ${confirmPassword && (confirmPassword === newPassword ? 'is-valid' : 'is-invalid')}`}
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                        <button 
                                            className="btn btn-outline-secondary" 
                                            type="button"
                                            onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                                        >
                                            <i className={`bi bi-${showPassword.confirm ? 'eye-slash' : 'eye'}`}></i>
                                        </button>
                                    </div>
                                    {confirmPassword && confirmPassword !== newPassword && (
                                        <div className="invalid-feedback d-block">
                                            Passwords don't match
                                        </div>
                                    )}
                                </div>

                                <div className="d-grid">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary" 
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Resetting Password...
                                            </>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
