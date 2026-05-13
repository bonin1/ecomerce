'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setupTwoFactorAuth, verifyAndEnableTwoFactorAuth, disableTwoFactorAuth, getTwoFactorAuthStatus } from '@/app/API/profile/twoFactorAuth';
import './two-factor.scss';

const TwoFactorAuthPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [setupLoading, setSetupLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [disabling, setDisabling] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [verificationToken, setVerificationToken] = useState('');
    const [password, setPassword] = useState('');
    const [disableToken, setDisableToken] = useState('');
    const [step, setStep] = useState<'info' | 'setup' | 'verification' | 'success' | 'disable'>('info');
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await getTwoFactorAuthStatus();
                if (response.status === 'success' && response.data) {
                    setTwoFactorEnabled(response.data.enabled);
                    setStep(response.data.enabled ? 'info' : 'info');
                }
            } catch (err) {
                setError('Failed to load 2FA status');
            } finally {
                setLoading(false);
            }
        };
        
        fetchStatus();
    }, []);
    
    useEffect(() => {
        if (step === 'verification' || step === 'disable') {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [step]);
    
    const handleSetupClick = async () => {
        setError(null);
        setSetupLoading(true);
        
        try {
            const response = await setupTwoFactorAuth();
            if (response.status === 'success' && response.data) {
                setQrCode(response.data.qrCodeUrl);
                setSecret(response.data.secret);
                setStep('setup');
            } else {
                throw new Error(response.message || 'Failed to set up 2FA');
            }
        } catch (err: any) {
            setError(err.message || 'Error setting up 2FA');
        } finally {
            setSetupLoading(false);
        }
    };
    
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setVerifying(true);
        
        try {
            const response = await verifyAndEnableTwoFactorAuth(verificationToken);
            if (response.status === 'success') {
                setTwoFactorEnabled(true);
                setStep('success');
            } else {
                throw new Error(response.message || 'Verification failed');
            }
        } catch (err: any) {
            setError(err.message || 'Error verifying code');
        } finally {
            setVerifying(false);
        }
    };
    
    const handleDisable = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setDisabling(true);
        
        try {
            const response = await disableTwoFactorAuth(password, disableToken);
            if (response.status === 'success') {
                setTwoFactorEnabled(false);
                setStep('info');
                setPassword('');
                setDisableToken('');
            } else {
                throw new Error(response.message || 'Failed to disable 2FA');
            }
        } catch (err: any) {
            setError(err.message || 'Error disabling 2FA');
        } finally {
            setDisabling(false);
        }
    };
    
    const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 6);
        if (step === 'verification') {
            setVerificationToken(value);
        } else {
            setDisableToken(value);
        }
    };
    
    if (loading) {
        return (
            <div className="two-factor-container">
                <div className="page-header">
                    <h2>Two-Factor Authentication</h2>
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
            
            <div className="content-panel">
                {step === 'info' && (
                    <>
                        <div className="two-factor-status mb-4">
                            <div className={`status-indicator ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                                <i className={`bi ${twoFactorEnabled ? 'bi-shield-check' : 'bi-shield'}`}></i>
                            </div>
                            <div className="status-info">
                                <h5>
                                    Two-factor authentication is {twoFactorEnabled ? 'enabled' : 'disabled'}
                                </h5>
                                <p className="text-muted mb-0">
                                    {twoFactorEnabled 
                                        ? 'Your account is protected with an additional layer of security.' 
                                        : 'Enable two-factor authentication for enhanced account security.'}
                                </p>
                                {twoFactorEnabled && (
                                    <span className="badge bg-success mt-2">
                                        <i className="bi bi-check-circle-fill me-1"></i>
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="card-title">What is two-factor authentication?</h5>
                                <p className="card-text">
                                    Two-factor authentication adds an extra layer of security to your account. 
                                    In addition to your password, you'll need a verification code generated by 
                                    an authenticator app on your mobile device to log in.
                                </p>
                                <div className="d-flex gap-2 align-items-center">
                                    <i className="bi bi-phone fs-4"></i>
                                    <div>
                                        <h6 className="mb-0">Authenticator App Required</h6>
                                        <p className="text-muted small mb-0">
                                            You'll need an authenticator app like Google Authenticator, 
                                            Microsoft Authenticator, or Authy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {twoFactorEnabled ? (
                            <button
                                className="btn btn-danger"
                                onClick={() => setStep('disable')}
                            >
                                <i className="bi bi-shield-x me-2"></i>
                                Disable Two-Factor Authentication
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={handleSetupClick}
                                disabled={setupLoading}
                            >
                                {setupLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-shield-plus me-2"></i>
                                        Set up Two-Factor Authentication
                                    </>
                                )}
                            </button>
                        )}
                    </>
                )}
                
                {step === 'setup' && qrCode && secret && (
                    <>
                        <div className="setup-instructions mb-4">
                            <h5>Set up your authenticator app</h5>
                            <p className="mb-4">
                                Scan the QR code below with your authenticator app or enter the setup key manually.
                            </p>
                            
                            <div className="qr-container mb-3">
                                <img src={qrCode} alt="QR Code" className="qr-code" />
                            </div>
                            
                            <div className="manual-key-container">
                                <label className="form-label">Manual setup key:</label>
                                <div className="input-group mb-3">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={secret} 
                                        readOnly 
                                    />
                                    <button 
                                        className="btn btn-outline-secondary" 
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(secret);
                                            alert('Secret key copied to clipboard!');
                                        }}
                                    >
                                        <i className="bi bi-clipboard"></i>
                                    </button>
                                </div>
                                <small className="text-muted">
                                    If you can't scan the QR code, enter this text code into your authenticator app.
                                </small>
                            </div>
                        </div>
                        
                        <div className="d-flex justify-content-between">
                            <button 
                                className="btn btn-outline-secondary" 
                                onClick={() => setStep('info')}
                            >
                                Back
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => setStep('verification')}
                            >
                                Continue
                            </button>
                        </div>
                    </>
                )}
                
                {step === 'verification' && (
                    <form onSubmit={handleVerify} className="verification-form">
                        <h5 className="mb-4">Verify your authenticator app</h5>
                        <p className="mb-4">
                            Enter the 6-digit verification code from your authenticator app to enable two-factor authentication.
                        </p>
                        
                        <div className="mb-4">
                            <label htmlFor="verificationCode" className="form-label">
                                Verification code
                            </label>
                            <input
                                type="text"
                                className="form-control verification-input"
                                id="verificationCode"
                                value={verificationToken}
                                onChange={handleTokenChange}
                                placeholder="000000"
                                maxLength={6}
                                pattern="\d{6}"
                                autoComplete="off"
                                required
                                ref={inputRef}
                            />
                            <div className="form-text">
                                The verification code is 6 digits long.
                            </div>
                        </div>
                        
                        <div className="d-flex justify-content-between">
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary" 
                                onClick={() => setStep('setup')}
                                disabled={verifying}
                            >
                                Back
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={verifying || verificationToken.length !== 6}
                            >
                                {verifying ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify & Enable'
                                )}
                            </button>
                        </div>
                    </form>
                )}
                
                {step === 'success' && (
                    <div className="success-container text-center py-4">
                        <div className="success-icon mb-3">
                            <i className="bi bi-shield-check"></i>
                        </div>
                        <h4 className="mb-3">Two-factor authentication enabled!</h4>
                        <p className="mb-4">
                            Your account is now protected with an additional layer of security.
                            Each time you sign in, you'll need to provide a verification code from your
                            authenticator app.
                        </p>
                        
                        <div className="alert alert-warning mb-4">
                            <div className="d-flex">
                                <div className="me-3">
                                    <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                                </div>
                                <div className="text-start">
                                    <h6>Important Security Notice</h6>
                                    <p className="mb-0">
                                        Keep your authenticator app safe. If you lose access to your 
                                        authenticator app, you might be unable to log in to your account.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            className="btn btn-primary"
                            onClick={() => setStep('info')}
                        >
                            Finish
                        </button>
                    </div>
                )}
                
                {step === 'disable' && (
                    <form onSubmit={handleDisable} className="disable-form">
                        <div className="alert alert-warning mb-4">
                            <div className="d-flex">
                                <div className="me-3">
                                    <i className="bi bi-exclamation-triangle-fill fs-3"></i>
                                </div>
                                <div>
                                    <h5>Warning: Reducing Account Security</h5>
                                    <p className="mb-0">
                                        Disabling two-factor authentication will make your account less secure.
                                        To confirm this action, please enter your password and current verification code.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">
                                Your password
                            </label>
                            <div className="input-group">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className="form-control" 
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button 
                                    className="btn btn-outline-secondary" 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                                </button>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <label htmlFor="disableToken" className="form-label">
                                Verification code from authenticator app
                            </label>
                            <input
                                type="text"
                                className="form-control verification-input"
                                id="disableToken"
                                value={disableToken}
                                onChange={handleTokenChange}
                                placeholder="000000"
                                maxLength={6}
                                pattern="\d{6}"
                                autoComplete="off"
                                required
                                ref={inputRef}
                            />
                        </div>
                        
                        <div className="d-flex justify-content-between">
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary" 
                                onClick={() => {
                                    setStep('info');
                                    setPassword('');
                                    setDisableToken('');
                                    setError(null);
                                }}
                                disabled={disabling}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-danger"
                                disabled={disabling || !password || disableToken.length !== 6}
                            >
                                {disabling ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Disabling...
                                    </>
                                ) : (
                                    'Disable Two-Factor Authentication'
                                )}
                            </button>
                        </div>
                    </form>
                )}
                
                {step !== 'info' && step !== 'disable' && step !== 'success' && (
                    <div className="mt-4">
                        <button 
                            className="btn btn-link text-decoration-none p-0"
                            onClick={() => {
                                setStep('info');
                                setError(null);
                            }}
                        >
                            <i className="bi bi-x-circle me-1"></i>
                            Cancel setup
                        </button>
                    </div>
                )}
                
                <div className="mt-4">
                    <Link href="/profile/security" className="btn btn-outline-secondary">
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Security Settings
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TwoFactorAuthPage;
