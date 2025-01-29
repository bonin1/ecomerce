'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/global/navbar';

const VerificationSuccess = () => {
    const router = useRouter();

    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card text-center">
                            <div className="card-body">
                                <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                                <h2 className="mt-3">Email Verified Successfully!</h2>
                                <p className="card-text">Your email has been verified. You can now log in to your account.</p>
                                <button
                                    className="btn btn-primary mt-3"
                                    onClick={() => router.push('/login')}
                                >
                                    Go to Login
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VerificationSuccess;
