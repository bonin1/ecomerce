'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { verifyEmailChange } from '@/app/API/profile/emailVerification';
import { Spinner } from 'react-bootstrap';

export default function EmailVerificationPage() {
    const router = useRouter();
    const params = useParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await verifyEmailChange(params.token as string);
                if (response.status === 'success') {
                    setStatus('success');
                    setMessage(response.message);
                    setTimeout(() => router.push('/profile'), 3000);
                } else {
                    throw new Error(response.message || 'Verification failed');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error instanceof Error ? error.message : 'Verification failed');
            }
        };

        verifyEmail();
    }, [params.token, router]);

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body text-center">
                            <h2 className="card-title mb-4">Email Verification</h2>
                            
                            {status === 'verifying' && (
                                <div className="text-center p-4">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-3">Verifying your email change...</p>
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="alert alert-success" role="alert">
                                    <i className="bi bi-check-circle me-2"></i>
                                    {message || 'Email successfully updated!'}
                                    <p className="mt-2 small">Redirecting to profile...</p>
                                </div>
                            )}

                            {status === 'error' && (
                                <div>
                                    <div className="alert alert-danger" role="alert">
                                        <i className="bi bi-x-circle me-2"></i>
                                        {message || 'Failed to verify email change.'}
                                    </div>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => router.push('/profile')}
                                    >
                                        Return to Profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
