'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import LoginForm from '../components/login/login';
import { login } from '../API/auth/login';
import { LoginData } from '../types';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import './MainLogin.scss';

const LoginPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);

    const handleLogin = async (data: LoginData) => {
        try {
            setLoading(true);
            
            const response = await login(data);
            
            if (!response.success) {
                toast.error(response.message || 'Login failed. Please try again.');
                return;
            }

            if (response.requireOTP) {
                router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
                return;
            }

            if (response.data) {
                toast.success('Login successful!');
                localStorage.setItem('user', JSON.stringify(response.data.user));
                router.push('/profile');
            }
        } catch (err) {
            console.error('Login error:', err);
            toast.error('Unable to connect to the server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="text-start">
                <Link href="/" className="text-decoration-none">
                    <img 
                        src="/logo/STRIKETECH-1.png" 
                        alt="Logo" 
                        className="logo"
                    />
                </Link>
            </div>
            <div className="row justify-content-center">
                <div className="col-12 col-md-6 col-lg-5">
                    <div className="card shadow-sm border-0 p-4 mt-5">
                        <div className="text-center mb-4">
                            <h2 className="fw-bold">Welcome Back</h2>
                            <p className="text-muted">Sign in to continue</p>
                        </div>
                        <LoginForm 
                            onSubmit={handleLogin}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
};

export default LoginPage;
