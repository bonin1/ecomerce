'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../components/login/login';
import { login } from '../API/auth/login';
import { LoginData } from '../types';
import Link from 'next/link';
import './MainLogin.scss';

const LoginPage = () => {
    const router = useRouter();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleLogin = async (data: LoginData) => {
        try {
            setLoading(true);
            setError('');
            
            const response = await login(data);
            
            if (!response.success) {
                setError(response.message || 'Login failed. Please try again.');
                return;
            }

            if (response.data) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                setTimeout(() => {
                    router.push('/dashboard');
                }, 100);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Unable to connect to the server. Please try again later.');
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
                            error={error}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
