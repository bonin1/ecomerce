'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '../../API/profile/getProfile';
import { updateProfile, updateProfilePicture, deleteProfilePicture } from '../../API/profile/updateProfile';
import './edit.scss';
import { initiateEmailChange } from '../../API/profile/updateProfile';

interface ProfileData {
    name: string;
    lastname: string;
    email: string;
    phone_number?: string;
    profile_picture?: string;
}

const EditProfilePage = () => {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData>({
        name: '',
        lastname: '',
        email: '',
        phone_number: '',
    });
    const [initialProfile, setInitialProfile] = useState<ProfileData>({
        name: '',
        lastname: '',
        email: '',
        phone_number: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
            });

            if (selectedFile) {
                const pictureResponse = await updateProfilePicture(selectedFile);
                if (pictureResponse.data?.profile_picture) {
                    setProfile(prev => ({
                        ...prev,
                        profile_picture: pictureResponse.data.profile_picture
                    }));
                }
            }

            router.push('/profile');
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
        return <div className="edit-profile-loading">Loading...</div>;
    }

    return (
        <div className="edit-profile-container">
            <form onSubmit={handleSubmit} className="edit-profile-form">
                <h1>Edit Profile</h1>
                
                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}

                <div className="profile-picture-section">
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
                            <button 
                                type="button" 
                                className="btn btn-danger btn-sm mt-2"
                                onClick={handleDeletePicture}
                            >
                                Remove Picture
                            </button>
                        </div>
                    ) : (
                        <div className="avatar-placeholder">
                            {profile.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="form-control mt-2"
                    />
                </div>

                <div className="form-group">
                    <label>First Name</label>
                    <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Last Name</label>
                    <input
                        type="text"
                        name="lastname"
                        value={profile.lastname}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Phone Number</label>
                    <input
                        type="tel"
                        name="phone_number"
                        value={profile.phone_number || ''}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>

                <div className="form-actions">
                    <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => router.push('/profile')}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfilePage;
