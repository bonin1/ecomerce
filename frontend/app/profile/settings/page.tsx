'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProfile } from '@/app/API/profile/getProfile';
import './settings.scss';

const AccountSettingsPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // In the future, this could load user preferences from a settings API
                // For now, we just get the profile to check if it exists
                await getProfile();
                setLoading(false);
            } catch (err) {
                setError('Failed to load settings');
                setLoading(false);
            }
        };
        
        loadSettings();
    }, []);
    
    const handleSaveSettings = async () => {
        // This would save user preferences via an API call
        // For now, just simulate success
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push('/profile');
        }, 1000);
    };

    if (loading) {
        return (
            <div className="settings-loading">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-container">
            <div className="page-header">
                <h2>Account Settings</h2>
                <p className="text-muted">Manage your preferences and account settings</p>
            </div>
            
            {error && (
                <div className="alert alert-danger mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}
            
            <div className="content-panel">
                <div className="settings-section">
                    <h5 className="section-title">Notification Preferences</h5>
                    <hr className="mt-2 mb-3" />
                    
                    <div className="form-check mb-3">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="emailNotifications"
                            checked={emailNotifications}
                            onChange={() => setEmailNotifications(!emailNotifications)}
                        />
                        <label className="form-check-label" htmlFor="emailNotifications">
                            <div>Email Notifications</div>
                            <small className="text-muted">Receive emails about your account, purchases and orders</small>
                        </label>
                    </div>
                    
                    <div className="form-check mb-3">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="marketingEmails"
                            checked={marketingEmails}
                            onChange={() => setMarketingEmails(!marketingEmails)}
                        />
                        <label className="form-check-label" htmlFor="marketingEmails">
                            <div>Marketing Emails</div>
                            <small className="text-muted">Receive promotional emails about special offers and new products</small>
                        </label>
                    </div>
                </div>
                
                <div className="settings-section mt-4">
                    <h5 className="section-title">Account Management</h5>
                    <hr className="mt-2 mb-3" />
                    
                    <div className="row mb-3">
                        <div className="col-md-8">
                            <h6>Password and Security</h6>
                            <p className="text-muted">Update your password and manage security settings</p>
                        </div>
                        <div className="col-md-4 text-md-end">
                            <Link href="/profile/password" className="btn btn-outline-primary btn-sm">
                                <i className="bi bi-lock me-2"></i>
                                Change Password
                            </Link>
                        </div>
                    </div>
                    
                    <div className="row mb-3">
                        <div className="col-md-8">
                            <h6>Personal Information</h6>
                            <p className="text-muted">Update your profile information and contact details</p>
                        </div>
                        <div className="col-md-4 text-md-end">
                            <Link href="/profile/edit" className="btn btn-outline-primary btn-sm">
                                <i className="bi bi-pencil me-2"></i>
                                Edit Profile
                            </Link>
                        </div>
                    </div>
                    
                    <div className="row">
                        <div className="col-md-8">
                            <h6>Delete Account</h6>
                            <p className="text-muted text-danger">This action will schedule your account for deletion</p>
                        </div>
                        <div className="col-md-4 text-md-end">
                            <Link href="/profile/delete" className="btn btn-outline-danger btn-sm">
                                <i className="bi bi-trash me-2"></i>
                                Delete Account
                            </Link>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 d-flex justify-content-between">
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => router.push('/profile')}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Profile
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={handleSaveSettings}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-save me-2"></i>
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountSettingsPage;
