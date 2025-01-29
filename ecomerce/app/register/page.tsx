'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterData } from '../types';
import { registerUser } from '../API/auth/register';
import RegisterForm from '../components/register/register';
import './MainRegister.scss';

const Register = () => {
    const router = useRouter();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: RegisterData) => {
        setError('');
        setLoading(true);

        try {
            const response = await registerUser(formData);
            if (response.success) {
                router.push(`/verify-email/pending?email=${encodeURIComponent(formData.email)}`);
            } else {
                setError(response.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('An error occurred during registration. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light bg-gradient register-page">
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
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card border-0 shadow-lg">
                            <div className="card-body p-4 p-md-5">
                                <div className="text-center mb-4">
                                    <h2 className="h3 fw-bold text-primary mb-2">Create Your Account</h2>
                                    <p className="text-muted">Join our community and start shopping</p>
                                </div>
                                <RegisterForm 
                                    onSubmit={handleSubmit}
                                    error={error}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;