'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { verifyOTP } from '../API/auth/verifyOtp';

export default function OTPVerification() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleChange = (index: number, value: string) => {
        if (value.length <= 1 && !isNaN(Number(value))) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-focus next input
            if (value && index < 5) {
                const nextInput = document.getElementById(`otp-${index + 1}`);
                nextInput?.focus();
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await verifyOTP(email!, otp.join(''));

            if (response.success && response.data) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                toast.success('Successfully verified!');
                router.push('/profile');
            } else {
                toast.error(response.message || 'Verification failed');
            }
        } catch (error) {
            toast.error('Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="text-start">
                <Link href="/" className="text-decoration-none">
                    <img src="/logo/STRIKETECH-1.png" alt="Logo" className="logo" />
                </Link>
            </div>
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-4">
                    <div className="card shadow-sm border-0 p-4 mt-5">
                        <div className="text-center mb-4">
                            <h4>Verify Your Login</h4>
                            <p className="text-muted small">
                                Enter the verification code sent to<br />
                                <span className="fw-bold">{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="d-flex justify-content-between gap-2 mb-4">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        id={`otp-${index}`}
                                        className="form-control text-center"
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        maxLength={1}
                                        style={{ width: '45px' }}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>

                            <div className="text-center mb-3">
                                <small className="text-muted">
                                    Time remaining: {Math.floor(timeLeft / 60)}:
                                    {(timeLeft % 60).toString().padStart(2, '0')}
                                </small>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={loading || otp.some(digit => !digit)}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Verifying...
                                    </>
                                ) : 'Verify Code'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
