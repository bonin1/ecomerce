'use client';
import { useRouter } from 'next/navigation';

export default function EmailChangePendingPage() {
    const router = useRouter();

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body text-center">
                            <i className="bi bi-envelope-check display-1 text-primary mb-4"></i>
                            <h2 className="card-title mb-3">Email Change Requested</h2>
                            
                            <div className="alert alert-info" role="alert">
                                <p className="mb-0">We've sent a verification email to your current email address.</p>
                            </div>

                            <p className="text-muted mb-4">
                                Please check your inbox and click the verification link 
                                to complete the email change.
                            </p>

                            <div className="d-grid gap-2">
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => router.push('/profile')}
                                >
                                    <i className="bi bi-arrow-left me-2"></i>
                                    Return to Profile
                                </button>
                            </div>

                            <div className="mt-4">
                                <p className="text-muted small">
                                    Didn't receive the email? Check your spam folder or
                                    <button 
                                        className="btn btn-link btn-sm"
                                        onClick={() => router.push('/profile/edit')}
                                    >
                                        try again
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
