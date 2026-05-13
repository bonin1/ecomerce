'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { reactivateAccount } from '@/app/API/profile/updateProfile';
import { getProfile } from '@/app/API/profile/getProfile';
import './reactivate.scss';

const ReactivateAccountPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletionDate, setDeletionDate] = useState<string | null>(null);

    useEffect(() => {
        const checkDeletionStatus = async () => {
            try {
                const response = await getProfile();
                if (response.success && response.data) {
                    if (response.data.marked_for_deletion && response.data.deletion_date) {
                        setDeletionDate(new Date(response.data.deletion_date).toLocaleDateString());
                    } else {
                        router.push('/profile');
                    }
                }
            } catch (err) {
                setError('Could not retrieve account information');
            } finally {
                setInitialLoading(false);
            }
        };

        checkDeletionStatus();
    }, [router]);

    const handleReactivate = async () => {
        setLoading(true);
        setError(null);
        
        try {
            await reactivateAccount();
            router.push('/profile');
        } catch (err: any) {
            setError(err.message || 'Failed to reactivate account');
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="reactivate-container">
            <div className="page-header">
                <h2>Reactivate Your Account</h2>
                <p className="text-muted">Your account is currently scheduled for deletion</p>
            </div>
            
            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}
            
            <div className="content-panel">
                <div className="text-center mb-4">
                    <i className="bi bi-arrow-counterclockwise text-primary reactivate-icon"></i>
                    <h4 className="mt-3">Would you like to keep your account?</h4>
                </div>
                
                <div className="alert alert-info">
                    Your account is currently scheduled for deletion on <strong>{deletionDate}</strong>. 
                    You can reactivate your account to cancel the deletion process.
                </div>
                
                <p>
                    By reactivating your account:
                </p>
                <ul>
                    <li>Your account will no longer be scheduled for deletion</li>
                    <li>You'll regain full access to all features and your data</li>
                    <li>Any pending orders or transactions will continue to process normally</li>
                </ul>
                
                <div className="mt-4 d-grid gap-2 d-md-flex justify-content-md-between">
                    <button 
                        className="btn btn-outline-secondary" 
                        onClick={() => router.push('/profile')}
                        disabled={loading}
                    >
                        Back to Profile
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleReactivate}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Processing...
                            </>
                        ) : (
                            'Reactivate My Account'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReactivateAccountPage;
