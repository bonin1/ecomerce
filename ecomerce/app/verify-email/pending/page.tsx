'use client';
import React, { useState } from 'react';
import Navbar from '@/app/components/global/navbar';
import { resendVerification } from '@/app/API/auth/register';

const VerificationPending = () => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const email = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('email') : '';

    const handleResendEmail = async () => {
        if (!email) return;
        
        setLoading(true);
        try {
            const response = await resendVerification(email);
            setMessage(response.message);
        } catch (error) {
            setMessage('Failed to resend verification email. Please try again later.');
        }
        setLoading(false);
    };

    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card text-center">
                            <div className="card-body">
                                <i className="bi bi-envelope-check text-primary" style={{ fontSize: '4rem' }}></i>
                                <h2 className="mt-3">Verify Your Email</h2>
                                <p className="card-text">
                                    We've sent a verification email to <strong>{email}</strong>.<br />
                                    Please check your inbox and click the verification link.
                                </p>
                                {message && (
                                    <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`}>
                                        {message}
                                    </div>
                                )}
                                <button
                                    className="btn btn-primary mt-3"
                                    onClick={handleResendEmail}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Sending...
                                        </>
                                    ) : 'Resend Verification Email'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VerificationPending;
