'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '../API/profile/getProfile';
import { getActivityHistory } from '../API/profile/updateProfile';
import { getTwoFactorAuthStatus } from '../API/profile/twoFactorAuth';
import Link from 'next/link';
import { Tabs, Tab } from 'react-bootstrap';
import './profile.scss';

interface ProfileData {
    name: string;
    lastname: string;
    email: string;
    profile_picture?: string;
    phone_number?: string;
    role: string;
    created_at: string;
    address?: string;
    city?: string;
    marked_for_deletion?: boolean;
    deletion_date?: string;
    two_factor_enabled?: boolean;
    verified?: boolean;
    last_login_ip?: string;
    last_login_device?: string;
}

interface ActivityData {
    id: number;
    activity_type: string;
    details: any;
    createdAt: string;
    ip_address?: string;
    user_agent?: string;
}

const ProfilePage = () => {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [activities, setActivities] = useState<ActivityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activityLoading, setActivityLoading] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
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

        const fetch2FAStatus = async () => {
            try {
                const response = await getTwoFactorAuthStatus();
                if (response.status === 'success' && response.data) {
                    setTwoFactorEnabled(response.data.enabled);
                }
            } catch (err) {
                console.error('2FA status error:', err);
                // Don't set an error here as it's not critical
            }
        };

        fetchProfile();
        fetch2FAStatus();
    }, []);

    const loadActivityHistory = async () => {
        if (activeTab === 'activity' && activities.length === 0) {
            setActivityLoading(true);
            try {
                const response = await getActivityHistory();
                if (response.status === 'success' && response.data) {
                    setActivities(response.data.activities);
                }
            } catch (error) {
                console.error('Error fetching activities:', error);
            } finally {
                setActivityLoading(false);
            }
        }
    };

    useEffect(() => {
        loadActivityHistory();
    }, [activeTab]);

    const calculateProfileCompletion = () => {
        if (!profile) return 0;
        
        const fields = [
            !!profile.name,
            !!profile.lastname,
            !!profile.email,
            !!profile.profile_picture,
            !!profile.phone_number,
            !!profile.address,
            !!profile.city
        ];
        
        const completedFields = fields.filter(Boolean).length;
        return Math.round((completedFields / fields.length) * 100);
    };

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
        <div className="wrapper">
            <div className="wrapper-assist">
                <div className="profile-container">
                <div className="page-header">
                    <h1>My Account</h1>
                    <p className="text-muted">Manage your account settings and preferences</p>
                </div>

                {profile?.marked_for_deletion && (
                    <div className="alert alert-warning mb-4">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        Your account is scheduled for deletion on {new Date(profile.deletion_date || '').toLocaleDateString()}.
                        <Link href="/profile/reactivate" className="alert-link ms-2">Cancel Deletion</Link>
                    </div>
                )}

                <div className="profile-layout">
                    <div className="sidebar">
                        <div className="avatar-section">
                            <div className="user-avatar">
                                {profile?.profile_picture ? (
                                    <img 
                                        src={profile.profile_picture}
                                        alt="Profile"
                                        className="avatar-image"
                                        onError={(e) => {
                                            console.error('Image load error');
                                            e.currentTarget.style.display = 'none';
                                            const placeholder = document.createElement('div');
                                            placeholder.className = 'avatar-placeholder';
                                            placeholder.innerText = profile?.name?.[0]?.toUpperCase() || 'U';
                                            e.currentTarget.parentNode?.appendChild(placeholder);
                                            }}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {profile?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                <h3 className="user-name mt-3">{`${profile?.name || ''} ${profile?.lastname || ''}`}</h3>
                                <p className="user-email">{profile?.email}</p>
                                
                                <div className="status-badges mt-2">
                                    {twoFactorEnabled && (
                                        <span className="badge bg-success me-1" title="Two-factor authentication is enabled">
                                            <i className="bi bi-shield-check me-1"></i>Secured
                                        </span>
                                    )}
                                    {profile?.verified && (
                                        <span className="badge bg-primary" title="Email is verified">
                                            <i className="bi bi-patch-check me-1"></i>Verified
                                        </span>
                                    )}
                                </div>
                                
                                <div className="profile-completion mt-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small">Profile Completion</span>
                                        <span className="small">{calculateProfileCompletion()}%</span>
                                    </div>
                                    <div className="progress">
                                        <div 
                                            className="progress-bar bg-success" 
                                            role="progressbar" 
                                            style={{ width: `${calculateProfileCompletion()}%` }} 
                                            aria-valuenow={calculateProfileCompletion()} 
                                            aria-valuemin={0} 
                                            aria-valuemax={100}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="profile-actions">
                                <Link href="/profile/edit" className="btn btn-primary btn-block mb-2">
                                    <i className="bi bi-pencil-square me-2"></i>
                                    Edit Profile
                                </Link>
                                <Link href="/profile/password" className="btn btn-outline-secondary btn-block mb-2">
                                    <i className="bi bi-shield-lock me-2"></i>
                                    Change Password
                                </Link>
                                <Link href="/profile/settings" className="btn btn-outline-secondary btn-block">
                                    <i className="bi bi-gear me-2"></i>
                                    Account Settings
                                </Link>
                            </div>
                            
                            <div className="sidebar-links mt-4">
                                <h6 className="sidebar-heading">Quick Links</h6>
                                <ul className="nav flex-column">
                                    <li className="nav-item">
                                        <Link href="/dashboard" className="nav-link">
                                            <i className="bi bi-speedometer2 me-2"></i>
                                            Dashboard
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/orders" className="nav-link">
                                            <i className="bi bi-box me-2"></i>
                                            Orders
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/wishlist" className="nav-link">
                                            <i className="bi bi-heart me-2"></i>
                                            Wishlist
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/profile/activity" className="nav-link">
                                            <i className="bi bi-clock-history me-2"></i>
                                            Activity Log
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/profile/security/two-factor" className="nav-link">
                                            <i className="bi bi-shield me-2"></i>
                                            Security Settings
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="main-content">
                            <div className="content-panel">
                                <div className="panel-header">
                                    <Tabs
                                        activeKey={activeTab}
                                        onSelect={(k) => setActiveTab(k || 'overview')}
                                        id="profile-tabs"
                                        className="mb-0 border-bottom-0"
                                    >
                                        <Tab eventKey="overview" title={<><i className="bi bi-person me-2"></i>Overview</>} />
                                        <Tab eventKey="activity" title={<><i className="bi bi-clock-history me-2"></i>Activity</>} />
                                        <Tab eventKey="security" title={<><i className="bi bi-shield me-2"></i>Security</>} />
                                    </Tabs>
                                </div>
                                
                                <div className="panel-body">
                                    {activeTab === 'overview' && (
                                        <div className="overview-tab">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="info-group">
                                                        <label>Full Name</label>
                                                        <p>{`${profile?.name || ''} ${profile?.lastname || ''}`}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="info-group">
                                                        <label>Email</label>
                                                        <p>{profile?.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="info-group">
                                                        <label>Phone Number</label>
                                                        <p>{profile?.phone_number || 'Not provided'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="info-group">
                                                        <label>Member Since</label>
                                                        <p>{new Date(profile?.created_at || '').toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="info-group">
                                                        <label>Address</label>
                                                        <p>{profile?.address ? `${profile.address}, ${profile.city || ''}` : 'Not provided'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4">
                                                <h5>Account Information</h5>
                                                <hr />
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="info-group">
                                                            <label>Account Status</label>
                                                            <p>
                                                                {profile?.marked_for_deletion ? (
                                                                    <span className="text-danger">Pending Deletion</span>
                                                                ) : (
                                                                    <span className="text-success">Active</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="info-group">
                                                            <label>Last Login IP</label>
                                                            <p>{profile?.last_login_ip || 'Not available'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="info-group">
                                                            <label>Email Status</label>
                                                            <p>
                                                                {profile?.verified ? (
                                                                    <span className="text-success">
                                                                        <i className="bi bi-check-circle-fill me-1"></i>
                                                                        Verified
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-warning">
                                                                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                                                                        Not Verified
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="info-group">
                                                            <label>Last Device</label>
                                                            <p>{profile?.last_login_device || 'Not available'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {activeTab === 'activity' && (
                                        <div className="activity-tab">
                                            {activityLoading ? (
                                                <div className="text-center p-5">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </div>
                                            ) : activities.length > 0 ? (
                                                <div className="activity-list">
                                                    {activities.map(activity => (
                                                        <div key={activity.id} className="activity-item">
                                                            <div className="activity-header">
                                                                <div>
                                                                    <span className="badge bg-primary me-2">{activity.activity_type}</span>
                                                                    <span className="activity-message">
                                                                        {activity.details?.message || 'Activity recorded'}
                                                                    </span>
                                                                </div>
                                                                <span className="activity-time">
                                                                    {new Date(activity.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {activity.ip_address && (
                                                                <div className="activity-details mt-1">
                                                                    <small className="text-muted">IP: {activity.ip_address}</small>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center p-5">
                                                    <i className="bi bi-clock-history text-muted display-4"></i>
                                                    <p className="text-muted mt-3">No activity recorded yet</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {activeTab === 'security' && (
                                        <div className="security-tab">
                                            <div className="security-section">
                                                <div className="row align-items-center">
                                                    <div className="col-md-8">
                                                        <h5>Security Center</h5>
                                                        <p className="text-muted">
                                                            Access all security features including two-factor authentication and more
                                                        </p>
                                                    </div>
                                                    <div className="col-md-4 text-md-end">
                                                        <Link href="/profile/security" className="btn btn-primary">
                                                            <i className="bi bi-shield me-2"></i>
                                                            Security Center
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <hr />
                                            
                                            <div className="security-section">
                                                <div className="row align-items-center">
                                                    <div className="col-md-8">
                                                        <h5>Two-Factor Authentication</h5>
                                                        <p className="text-muted d-flex align-items-center">
                                                            {twoFactorEnabled ? (
                                                                <>
                                                                    <span className="badge bg-success me-2">Enabled</span>
                                                                    Your account is protected with an additional security layer
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="badge bg-secondary me-2">Disabled</span>
                                                                    Add an extra layer of security to your account
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="col-md-4 text-md-end">
                                                        <Link href="/profile/security/two-factor" className="btn btn-outline-primary">
                                                            <i className={`bi bi-${twoFactorEnabled ? 'gear' : 'shield-plus'} me-2`}></i>
                                                            {twoFactorEnabled ? 'Manage 2FA' : 'Setup 2FA'}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <hr />
                                            
                                            <div className="security-section">
                                                <div className="row align-items-center">
                                                    <div className="col-md-8">
                                                        <h5>Password Management</h5>
                                                        <p className="text-muted">
                                                            It's a good idea to use a strong password that you're not using elsewhere
                                                        </p>
                                                    </div>
                                                    <div className="col-md-4 text-md-end">
                                                        <Link href="/profile/password" className="btn btn-outline-primary">
                                                            <i className="bi bi-lock me-2"></i>
                                                            Change Password
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <hr />
                                            
                                            <div className="security-section">
                                                <div className="row align-items-center">
                                                    <div className="col-md-8">
                                                        <h5>Activity History</h5>
                                                        <p className="text-muted">
                                                            View a detailed log of your account activity
                                                        </p>
                                                    </div>
                                                    <div className="col-md-4 text-md-end">
                                                        <Link href="/profile/activity" className="btn btn-outline-primary">
                                                            <i className="bi bi-clock-history me-2"></i>
                                                            View Activity
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        <hr />
                                            
                                            <div className="security-section">
                                                <div className="row align-items-center">
                                                    <div className="col-md-8">
                                                        <h5>Delete Account</h5>
                                                        <p className="text-muted">
                                                            Once you delete your account, there is no going back. Please be certain.
                                                        </p>
                                                    </div>
                                                    <div className="col-md-4 text-md-end">
                                                        <Link href="/profile/delete" className="btn btn-outline-danger">
                                                            <i className="bi bi-trash me-2"></i>
                                                            Delete Account
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
