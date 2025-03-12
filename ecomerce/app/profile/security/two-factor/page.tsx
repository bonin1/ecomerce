'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    setupTwoFactorAuth, 
    verifyAndEnableTwoFactorAuth, 
    disableTwoFactorAuth, 
    getTwoFactorAuthStatus 
} from '@/app/API/profile/twoFactorAuth';
import './two-factor.scss';

const TwoFactorAuthPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [setupKey, setSetupKey] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [enabled, setEnabled] = useState(false);
    
    useEffect(() => {
        const checkTwoFactorStatus = async () => {
            try {
                const response = await getTwoFactorAuthStatus();
                if (response.status === 'success' && response.data) {
                    setEnabled(response.data.enabled);
                    if (!response.data.enabled) {
                        const setupResponse = await setupTwoFactorAuth();
                        if (setupResponse.status === 'success' && setupResponse.data) {
                            setQrCodeUrl(setupResponse.data.qrCode);
                            setSetupKey(setupResponse.data.secret);
                        }
                    }
                }
            } catch (err) {
                setError('Failed to load 2FA status');
            } finally {
                setLoading(false);
            }
        };
        
        checkTwoFactorStatus();
    }, []);
    
    const handleVerify = async () => {
        if (verificationCode.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await verifyAndEnableTwoFactorAuth(verificationCode);
            if (response.status === 'success') {
                setSuccess(true);
                setEnabled(true);
            } else {
                throw new Error(response.message || 'Failed to verify code');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to verify code');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDisable = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await disableTwoFactorAuth();
            if (response.status === 'success') {
                setEnabled(false);
                setSuccess(false);
            } else {
                throw new Error(response.message || 'Failed to disable 2FA');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="two-factor-container">
            <div className="page-header">
                <h2>Two-Factor Authentication</h2>
                <p className="text-muted">Add an extra layer of security to your account</p>
            </div>
            
            {error && (
                <div className="alert alert-danger mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}
            
            {success && (
                <div className="alert alert-success mb-4">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Two-factor authentication has been successfully enabled for your account.
                </div>
            )}
            
            <div className="content-panel">
                {loading ? (
                    <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : enabled ? (
                    <div className="two-factor-status">
                        <div className="text-center mb-4">
                            <div className="status-icon enabled">
                                <i className="bi bi-shield-check"></i>
                            </div>
                            <h4 className="mt-3">Two-Factor Authentication is Active</h4>
                            <p className="text-success">
                                Your account is protected with an additional security layer.
                            </p>
                        </div>
                        
                        <div className="alert alert-info">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            You'll be asked for a verification code each time you sign in from a new device or browser.
                        </div>
                        
                        <div className="mt-4 d-grid gap-2 d-md-flex justify-content-md-end">
                            <button 
                                className="btn btn-outline-danger"
                                onClick={handleDisable}
                                disabled={loading}
                            >
                                <i className="bi bi-shield-x me-2"></i>
                                Disable Two-Factor Authentication
                            </button>
                            <button 
                                className="btn btn-outline-primary"
                                onClick={() => router.push('/profile')}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Back to Profile
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="two-factor-setup">
                        <div className="text-center mb-4">
                            <div className="status-icon">
                                <i className="bi bi-shield-lock"></i>
                            </div>
                            <h4 className="mt-3">Set Up Two-Factor Authentication</h4>
                            <p className="text-muted">
                                Protect your account with an authenticator app like Google Authenticator or Authy.
                            </p>
                        </div>
                        
                        <div className="step-container">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h5>Download an authenticator app</h5>
                                <p>
                                    If you don't already have one, download an authenticator app like 
                                    <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noreferrer"> Google Authenticator</a> or 
                                    <a href="https://authy.com/download/" target="_blank" rel="noreferrer"> Authy</a>.
                                </p>
                            </div>
                        </div>
                        
                        <div className="step-container">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h5>Scan the QR code or enter the setup key</h5>
                                <div className="qr-container text-center my-3">
                                    {qrCodeUrl && (
                                        <img 
                                            src={qrCodeUrl} 
                                            alt="QR Code for 2FA Setup" 
                                            className="qr-code"
                                        />
                                    )}
                                </div>
                                {setupKey && (
                                    <div className="setup-key-container text-center mb-3">
                                        <p>If you can't scan the QR code, enter this setup key manually:</p>
                                        <div className="setup-key">
                                            {setupKey}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="step-container">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h5>Verify your setup</h5>
                                <p>Enter the 6-digit code from your authenticator app to verify the setup.</p>
                                <div className="verification-input mt-3">
                                    <div className="row g-2">
                                        <div className="col">
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                                placeholder="Enter 6-digit code"
                                                maxLength={6}
                                            />
                                        </div>
                                        <div className="col-auto">
                                            <button 
                                                className="btn btn-primary" 
                                                onClick={handleVerify}
                                                disabled={verificationCode.length !== 6 || loading}
                                            >
                                                Verify & Activate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 d-grid gap-2 d-md-flex justify-content-md-between">
                            <button 
                                className="btn btn-outline-secondary"
                                onClick={() => router.push('/profile')}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Back to Profile
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleVerify}
                                disabled={verificationCode.length !== 6 || loading}
                            >
                                <i className="bi bi-shield-check me-2"></i>
                                Enable Two-Factor Authentication
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TwoFactorAuthPage;
