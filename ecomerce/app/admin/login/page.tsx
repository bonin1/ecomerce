'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';

const AdminLoginPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showOTP, setShowOTP] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [credentials, setCredentials] = useState({
        email: '',
        password: '',
        otp: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                })
            });

            const data = await response.json();

            if (data.requireOTP) {
                setUserId(data.userId);
                setShowOTP(true);
                toast.success('OTP sent to your email');
            } else if (!data.success) {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    userId,
                    otp: credentials.otp
                })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('adminToken', data.data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.data.user));
                
                Cookies.set('adminTokenSync', data.data.token, {
                    expires: 1/6, 
                    path: '/',
                    sameSite: 'Strict'
                });
                
                toast.success('Login successful');
                router.push('/admin/dashboard');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('OTP verification failed');
            console.error('OTP verification error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center align-items-center min-vh-100">
                <div className="col-md-6 col-lg-4">
                    <div className="card shadow">
                        <div className="card-body p-5">
                            <h2 className="text-center mb-4">Admin Login</h2>
                            {!showOTP ? (
                                <form onSubmit={handleLogin}>
                                    <div className="mb-3">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control"
                                            value={credentials.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            className="form-control"
                                            value={credentials.password}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100"
                                        disabled={loading}
                                    >
                                        {loading ? 'Logging in...' : 'Login'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleOTPSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label">Enter OTP</label>
                                        <input
                                            type="text"
                                            name="otp"
                                            className="form-control"
                                            value={credentials.otp}
                                            onChange={handleChange}
                                            required
                                            maxLength={6}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100"
                                        disabled={loading}
                                    >
                                        {loading ? 'Verifying...' : 'Verify OTP'}
                                    </button>
                                </form>
                            )}
                            <div className="mt-3 text-center">
                                <Link href="/" className="text-decoration-none">
                                    Back to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
};

export default AdminLoginPage;
