'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/global/navbar';

const VerifyEmail = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            if (!token) {
                setStatus('error');
                setMessage('Verification token is missing');
                return;
            }

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
                const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`);
                
                if (response.ok) {
                    setStatus('success');
                    setMessage('Email verified successfully!');
                    // Optionally redirect to login page after a delay
                    setTimeout(() => router.push('/login'), 3000);
                } else {
                    const data = await response.json();
                    setStatus('error');
                    setMessage(data.message || 'Verification failed');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred during verification');
            }
        };

        verifyEmail();
    }, [searchParams, router]);

    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card text-center">
                            <div className="card-body">
                                {status === 'verifying' && (
                                    <>
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h2 className="mt-3">Verifying your email...</h2>
                                    </>
                                )}
                                
                                {status === 'success' && (
                                    <>
                                        <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                                        <h2 className="mt-3">Email Verified!</h2>
                                        <p>{message}</p>
                                        <p>Redirecting to login page...</p>
                                    </>
                                )}
                                
                                {status === 'error' && (
                                    <>
                                        <i className="bi bi-x-circle text-danger" style={{ fontSize: '4rem' }}></i>
                                        <h2 className="mt-3">Verification Failed</h2>
                                        <p className="text-danger">{message}</p>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => router.push('/login')}
                                        >
                                            Go to Login
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VerifyEmail;
