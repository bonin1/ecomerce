'use client';

import { useState } from 'react';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    isProfileContext?: boolean;
}

export default function ForgotPasswordModal({ isOpen, onClose, isProfileContext = false }: ForgotPasswordModalProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setEmailSent(true);
            } else {
                setError(data.message || 'Failed to send reset email');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setEmailSent(false);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Reset Password</h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={handleClose}
                            aria-label="Close"
                        ></button>
                    </div>

                    <div className="modal-body">
                        {emailSent ? (
                            <div className="text-center py-4">
                                <div className="mb-3">
                                    <i className="bi bi-envelope-check text-success" style={{ fontSize: '3rem' }}></i>
                                </div>
                                <h4 className="mb-3">Email Sent!</h4>
                                <p className="text-muted mb-4">
                                    If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
                                </p>
                                <p className="small text-muted">
                                    The link will expire in 10 minutes. Be sure to check your spam folder if you don't see the email in your inbox.
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-primary mt-2"
                                    onClick={handleClose}
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div className="alert alert-danger mb-3">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        {error}
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="Enter your email"
                                    />
                                </div>

                                <div className="text-muted small mb-4">
                                    {isProfileContext ? (
                                        'Forgot your current password? Enter your email address and we\'ll send you instructions to reset it.'
                                    ) : (
                                        'Enter your email address and we\'ll send you instructions to reset your password.'
                                    )}
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleClose}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Sending...
                                            </>
                                        ) : 'Send Reset Link'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
