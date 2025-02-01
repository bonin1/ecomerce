'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '../API/profile/getProfile';
import './profile.scss';

interface ProfileData {
    name: string;
    lastname: string;
    email: string;
    profile_picture?: string;
    role: string;
    created_at: string;
}

const ProfilePage = () => {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getProfile();
                if (response.success && response.data) {
                    setProfile(response.data);
                } else {
                    setError(response.message || 'Failed to load profile');
                }
            } catch (err) {
                setError('Error loading profile');
                console.error('Profile fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-error">
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <h1>Profile</h1>
                    <div className="profile-avatar">
                        {profile?.profile_picture ? (
                            <img 
                                src={profile.profile_picture} 
                                alt="Profile" 
                                className="avatar-image"
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                {profile?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-info">
                    <div className="info-group">
                        <label>Full Name</label>
                        <p>{`${profile?.name || ''} ${profile?.lastname || ''}`}</p>
                    </div>

                    <div className="info-group">
                        <label>Email</label>
                        <p>{profile?.email}</p>
                    </div>

                    <div className="info-group">
                        <label>Role</label>
                        <p className="text-capitalize">{profile?.role}</p>
                    </div>

                    <div className="info-group">
                        <label>Member Since</label>
                        <p>{new Date(profile?.created_at || '').toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="profile-actions">
                    <button 
                        className="btn btn-primary"
                        onClick={() => router.push('/profile/edit')}
                    >
                        Edit Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
