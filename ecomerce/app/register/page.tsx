'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterData } from '../types';
import { registerUser } from '../API/auth/register';
import Navbar from '../components/global/navbar';

const Register = () => {
    const router = useRouter();
    const [formData, setFormData] = useState<RegisterData>({
        name: '',
        lastname: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Submitting registration data:', formData);
            const response = await registerUser(formData);
            console.log('Registration response:', response);

            if (response.success) {
                router.push('/login?registered=true');
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
        <>
            <Navbar />
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <h2 className="text-center mb-4">Create your account</h2>
                                
                                <form onSubmit={handleSubmit}>
                                    {error && (
                                        <div className="alert alert-danger" role="alert">
                                            {error}
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <input
                                            name="name"
                                            type="text"
                                            className="form-control"
                                            placeholder="First Name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <input
                                            name="lastname"
                                            type="text"
                                            className="form-control"
                                            placeholder="Last Name"
                                            value={formData.lastname}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <input
                                            name="email"
                                            type="email"
                                            className="form-control"
                                            placeholder="Email address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <input
                                            name="password"
                                            type="password"
                                            className="form-control"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="d-grid">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Registering...
                                                </>
                                            ) : 'Register'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;