'use client';
import React, { useState, useEffect } from 'react'
import { resendVerification } from '@/app/API/auth/register';
import Image from 'next/image';

const VerificationPending = () => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const email = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('email') : '';

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const handleResendEmail = async () => {
        if (!email || countdown > 0) return;
        
        setLoading(true);
        try {
            const response = await resendVerification(email);
            setMessage(response.message || 'Verification email sent successfully');
            setCountdown(30);
        } catch (error: any) {
            setMessage(error.message || 'Failed to resend verification email. Please try again later.');
            console.error('Resend error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
            <div className="card shadow-lg" style={{ maxWidth: '500px' }}>
                <div className="card-body p-5">
                    <div className="text-center">
                        <div className="mb-4">
                            <Image
                                src="/logo/STRIKETECH-1.png"
                                alt="Store Logo"
                                width={96}
                                height={96}
                                className="rounded-circle"
                            />
                        </div>

                        <div className="mb-4">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                                <i className="bi bi-envelope-check text-primary" style={{ fontSize: '2rem' }}></i>
                            </div>
                            <h2 className="fw-bold mb-3">Check Your Email</h2>
                            <p className="text-muted mb-2">
                                We've sent a verification link to
                            </p>
                            <p className="text-primary fw-semibold" style={{ wordBreak: 'break-all' }}>
                                {email}
                            </p>
                        </div>

                        {message && (
                            <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} mb-4`}>
                                {message}
                            </div>
                        )}

                        <div>
                            <button
                                className="btn btn-primary w-100 mb-3 position-relative"
                                onClick={handleResendEmail}
                                disabled={loading || countdown > 0}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Sending...
                                    </>
                                ) : countdown > 0 ? (
                                    `Resend available in ${countdown}s`
                                ) : (
                                    'Resend Verification Email'
                                )}
                            </button>

                            <div className="text-muted small">
                                <p className="mb-0">Didn't receive the email? Check your spam folder or try resending.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationPending;
