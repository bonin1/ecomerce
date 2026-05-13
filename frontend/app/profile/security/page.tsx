'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTwoFactorAuthStatus } from '@/app/API/profile/twoFactorAuth';
import './security.scss';

const SecurityPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchSecuritySettings = async () => {
            try {
                const response = await getTwoFactorAuthStatus();
                if (response.status === 'success' && response.data) {
                    setTwoFactorEnabled(response.data.enabled);
                }
            } catch (err) {
                setError('Failed to load security settings');
            } finally {
                setLoading(false);
            }
        };
        
        fetchSecuritySettings();
    }, []);

    if (loading) {
        return (
            <div className="security-container">
                <div className="page-header">
                    <h2>Security Settings</h2>
                </div>
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="security-container">
            <div className="page-header">
                <h2>Security Settings</h2>
                <p className="text-muted">Manage your account security and privacy</p>
            </div>
            
            {error && (
                <div className="alert alert-danger mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}
            
            <div className="content-panel">
                <div className="security-options">
                    <div className="security-card">
                        <div className="row align-items-center">
                            <div className="col-md-2 text-center mb-3 mb-md-0">
                                <div className={`security-icon ${twoFactorEnabled ? 'active' : ''}`}>
                                    <i className="bi bi-shield-lock"></i>
                                </div>
                            </div>
                            <div className="col-md-7 mb-3 mb-md-0">
                                <h4>Two-Factor Authentication</h4>
                                <p className="text-muted mb-0">
                                    {twoFactorEnabled
                                        ? "Your account is protected with an additional security layer"
                                        : "Add an extra layer of security to your account"}
                                </p>
                                <div className="mt-2">
                                    <span className={`badge ${twoFactorEnabled ? 'bg-success' : 'bg-warning'}`}>
                                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-3 text-md-end">
                                <Link href="/profile/security/two-factor" className="btn btn-primary">
                                    {twoFactorEnabled ? 'Manage' : 'Setup'}
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    <hr />
                    
                    <div className="security-card">
                        <div className="row align-items-center">
                            <div className="col-md-2 text-center mb-3 mb-md-0">
                                <div className="security-icon">
                                    <i className="bi bi-key"></i>
                                </div>
                            </div>
                            <div className="col-md-7 mb-3 mb-md-0">
                                <h4>Password Management</h4>
                                <p className="text-muted mb-0">
                                    Update your password regularly to keep your account secure
                                </p>
                            </div>
                            <div className="col-md-3 text-md-end">
                                <Link href="/profile/password" className="btn btn-primary">
                                    Change Password
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    <hr />
                    
                    <div className="security-card">
                        <div className="row align-items-center">
                            <div className="col-md-2 text-center mb-3 mb-md-0">
                                <div className="security-icon">
                                    <i className="bi bi-envelope-check"></i>
                                </div>
                            </div>
                            <div className="col-md-7 mb-3 mb-md-0">
                                <h4>Email Management</h4>
                                <p className="text-muted mb-0">
                                    Update your email address or verify your current email
                                </p>
                            </div>
                            <div className="col-md-3 text-md-end">
                                <Link href="/profile/edit" className="btn btn-primary">
                                    Update Email
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    <hr />
                    
                    <div className="security-card">
                        <div className="row align-items-center">
                            <div className="col-md-2 text-center mb-3 mb-md-0">
                                <div className="security-icon warning">
                                    <i className="bi bi-trash"></i>
                                </div>
                            </div>
                            <div className="col-md-7 mb-3 mb-md-0">
                                <h4>Account Deletion</h4>
                                <p className="text-muted mb-0">
                                    Permanently delete your account and all associated data
                                </p>
                                <div className="mt-2">
                                    <span className="badge bg-danger">
                                        Irreversible Action
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-3 text-md-end">
                                <Link href="/profile/delete" className="btn btn-outline-danger">
                                    Delete Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4">
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => router.push('/profile')}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecurityPage;
