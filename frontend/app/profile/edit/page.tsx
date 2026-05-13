'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '../../API/profile/getProfile';
import { updateProfile, updateProfilePicture, deleteProfilePicture } from '../../API/profile/updateProfile';
import { initiateEmailChange } from '../../API/profile/updateProfile';
import './edit.scss';

interface ProfileData {
    name: string;
    lastname: string;
    email: string;
    phone_number?: string;
    address?: string;
    city?: string;
    profile_picture?: string;
}

const EditProfilePage = () => {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData>({
        name: '',
        lastname: '',
        email: '',
        phone_number: '',
        address: '',
        city: '',
    });
    const [initialProfile, setInitialProfile] = useState<ProfileData>({
        name: '',
        lastname: '',
        email: '',
        phone_number: '',
        address: '',
        city: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await getProfile();
            if (response.data) {
                setProfile(response.data);
                setInitialProfile(response.data);
            }
        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please upload an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setSelectedFile(file);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({
                    ...prev,
                    profile_picture: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        
        try {
            if (profile.email !== initialProfile.email) {
                await initiateEmailChange(profile.email);
                router.push('/profile/email/pending');
                return;
            }

            await updateProfile({
                name: profile.name,
                lastname: profile.lastname,
                phone_number: profile.phone_number,
                address: profile.address,
                city: profile.city
            });

            if (selectedFile) {
                await updateProfilePicture(selectedFile);
            }
            
            setSuccess(true);
            setTimeout(() => {
                router.push('/profile');
            }, 2000);
        } catch (err) {
            setError('Failed to update profile');
            console.error('Update error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePicture = async () => {
        try {
            await deleteProfilePicture();
            setProfile(prev => ({ ...prev, profile_picture: undefined }));
        } catch (err) {
            setError('Failed to delete profile picture');
        }
    };

    if (loading) {
        return (
            <div className="edit-profile-loading">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="edit-profile-container">
            <div className="page-header">
                <h2>Edit Profile</h2>
                <p className="text-muted">Update your personal information</p>
            </div>
            
            {error && (
                <div className="alert alert-danger mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}
            
            {success && (
                <div className="alert alert-success mb-4" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Profile updated successfully! Redirecting...
                </div>
            )}

            <div className="content-panel">
                <form onSubmit={handleSubmit} className="edit-profile-form">
                    <div className="profile-picture-section">
                        <h5 className="mb-3">Profile Picture</h5>
                        {profile.profile_picture ? (
                            <div className="current-picture">
                                <img 
                                    src={profile.profile_picture}
                                    alt="Profile" 
                                    className="profile-image"
                                    onError={(e) => {
                                        console.error('Image load error');
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const placeholder = document.createElement('div');
                                        placeholder.className = 'avatar-placeholder';
                                        placeholder.innerText = profile?.name?.[0]?.toUpperCase() || 'U';
                                        target.parentElement?.appendChild(placeholder);
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="avatar-placeholder">
                                {profile.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        
                        <div className="picture-controls">
                            <div className="input-group mb-3">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="form-control"
                                    id="profilePicture"
                                />
                                {profile.profile_picture && (
                                    <button 
                                        type="button"
                                        className="btn btn-outline-danger"
                                        onClick={handleDeletePicture}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <small className="text-muted">Max size: 5MB. Supported formats: JPG, PNG, GIF</small>
                        </div>
                    </div>
                    
                    <hr className="my-4" />

                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="name">First Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="lastname">Last Name</label>
                                <input
                                    type="text"
                                    id="lastname"
                                    name="lastname"
                                    value={profile.lastname}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={profile.email}
                            onChange={handleInputChange}
                            className="form-control"
                            required
                        />
                        {profile.email !== initialProfile.email && (
                            <small className="text-warning">
                                <i className="bi bi-info-circle me-1"></i>
                                Changing your email will require verification
                            </small>
                        )}
                    </div>

                    <div className="row">
                        <div className="col-12">
                            <div className="form-group">
                                <label htmlFor="phone_number">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone_number"
                                    name="phone_number"
                                    value={profile.phone_number || ''}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="row">
                        <div className="col-md-8">
                            <div className="form-group">
                                <label htmlFor="address">Address</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={profile.address || ''}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label htmlFor="city">City</label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={profile.city || ''}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary"
                            onClick={() => router.push('/profile')}
                            disabled={saving}
                        >
                            <i className="bi bi-x-circle me-2"></i>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-circle me-2"></i>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfilePage;
