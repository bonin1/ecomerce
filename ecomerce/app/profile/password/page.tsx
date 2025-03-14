'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '../../API/profile/updateProfile';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';
import './password.scss';

const PasswordChangePage = () => {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showForgotModal, setShowForgotModal] = useState(false);

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
            setError("New passwords don't match");
            return;
        }
        
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await changePassword(currentPassword, newPassword);
            if (response.status === 'success') {
                setSuccess(true);
                
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordStrength(0);
                
                setTimeout(() => router.push('/profile'), 2000);
            } else {
                throw new Error(response.message || 'Failed to change password');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to change password');
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

    return (
        <div className="password-change-container">
            <div className="page-header">
                <h2>Change Password</h2>
                <p className="text-muted">Update your password to keep your account secure</p>
            </div>
            
            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}
            
            {success && (
                <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Password changed successfully! Redirecting...
                </div>
            )}

            <div className="content-panel">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <label htmlFor="currentPassword" className="form-label mb-0">Current Password</label>
                            <button 
                                type="button"
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() => setShowForgotModal(true)}
                            >
                                <small>Forgot password?</small>
                            </button>
                        </div>
                        <div className="input-group mt-1">
                            <input 
                                type={showPassword.current ? "text" : "password"} 
                                className="form-control" 
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                            <button 
                                className="btn btn-outline-secondary" 
                                type="button"
                                onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                            >
                                <i className={`bi bi-${showPassword.current ? 'eye-slash' : 'eye'}`}></i>
                            </button>
                        </div>
                    </div>

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

                    <div className="d-grid gap-2 d-md-flex justify-content-md-between">
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary" 
                            onClick={() => router.push('/profile')}
                            disabled={loading}
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            Back to Profile
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Processing...
                                </>
                            ) : (
                                'Change Password'
                            )}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Forgot Password Modal */}
            <ForgotPasswordModal 
                isOpen={showForgotModal}
                onClose={() => setShowForgotModal(false)}
                isProfileContext={true}
            />
        </div>
    );
};

export default PasswordChangePage;
