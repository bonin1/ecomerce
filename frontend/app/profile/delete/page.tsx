'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAccount } from '@/app/API/profile/updateProfile';
import './delete.scss';

const DeleteAccountPage = () => {
    const router = useRouter();
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (confirmText !== 'DELETE') {
            setError('Please type DELETE to confirm');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            await deleteAccount();
            router.push('/profile/delete/success');
        } catch (err: any) {
            setError(err.message || 'Failed to delete account');
            setLoading(false);
        }
    };

    return (
        <div className="delete-account-container">
            <div className="page-header">
                <h2>Delete Account</h2>
                <p className="text-danger">This action can be reversed within 30 days</p>
            </div>
            
            {error && (
                <div className="alert alert-danger mt-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}
            
            <div className="content-panel">
                <div className="text-center mb-4">
                    <i className="bi bi-exclamation-triangle-fill text-danger danger-icon"></i>
                    <h4 className="mt-3">Are you sure you want to delete your account?</h4>
                </div>
                
                <div className="alert alert-warning">
                    <strong>Important:</strong> Your account will be scheduled for deletion and will be permanently removed after 30 days.
                </div>
                
                <div className="delete-account-info">
                    <h5>What happens when you delete your account:</h5>
                    <ul>
                        <li>Your profile and personal information will be scheduled for deletion</li>
                        <li>You can cancel the deletion within 30 days</li>
                        <li>After 30 days, all your data will be permanently deleted</li>
                        <li>You'll lose access to any purchases, order history, and saved items</li>
                    </ul>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="confirmDelete" className="form-label">
                            Type <strong>DELETE</strong> to confirm
                        </label>
                        <input
                            type="text"
                            id="confirmDelete"
                            className="form-control"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="d-grid gap-2 d-md-flex justify-content-md-between">
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary" 
                            onClick={() => router.push('/profile')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-danger" 
                            disabled={loading || confirmText !== 'DELETE'}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Processing...
                                </>
                            ) : (
                                'Delete My Account'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteAccountPage;
