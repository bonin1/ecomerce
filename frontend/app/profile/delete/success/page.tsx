'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import './success.scss';

const DeleteAccountSuccessPage = () => {
    const router = useRouter();

    return (
        <div className="delete-success-container">
            <div className="page-header">
                <h2>Account Scheduled for Deletion</h2>
                <p className="text-warning">Your account will remain accessible for 30 days</p>
            </div>
            
            <div className="content-panel">
                <div className="text-center mb-4">
                    <i className="bi bi-clock-history text-warning warning-icon"></i>
                    <div className="alert alert-warning mt-3 mb-4">
                        Your account has been scheduled for deletion and will be permanently removed in 30 days.
                    </div>
                </div>
                
                <p>
                    If you change your mind, you can log in anytime within the next 30 days and reactivate your account
                    from your profile page.
                </p>
                
                <div className="countdown-info">
                    <h5>What happens next?</h5>
                    <ul>
                        <li>Your account remains inactive but still exists for 30 days</li>
                        <li>After 30 days, all personal data will be permanently deleted</li>
                        <li>You can reactivate your account by logging in and visiting your profile</li>
                    </ul>
                </div>
                
                <div className="mt-4 d-grid gap-2 d-md-flex justify-content-md-end">
                    <button 
                        className="btn btn-outline-secondary me-md-2"
                        onClick={() => router.push('/')}
                    >
                        Go to Homepage
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={() => router.push('/profile')}
                    >
                        Return to Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountSuccessPage;
