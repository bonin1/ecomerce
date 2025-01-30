'use client';

import { useState } from 'react';
import { changePassword } from '@/app/API/auth/changePassword';
import toast from 'react-hot-toast';

export default function ChangePasswordForm() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            if (response.success) {
                toast.success('Password changed successfully');
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            toast.error('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
            <div className="space-y-4 bg-white p-8 rounded-lg shadow">
                <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Current Password
                    </label>
                    <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                        minLength={8}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        New Password
                    </label>
                    <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                        minLength={8}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                        minLength={8}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Changing Password...' : 'Change Password'}
                </button>
            </div>
        </form>
    );
}
