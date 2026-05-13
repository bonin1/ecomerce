'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActivityHistory } from '@/app/API/profile/updateProfile';
import './activity.scss';

interface ActivityData {
    id: number;
    activity_type: string;
    details: any;
    createdAt: string;
    ip_address?: string;
    user_agent?: string;
}

interface PaginationInfo {
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

const ActivityPage = () => {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
    });

    useEffect(() => {
        fetchActivities(1);
    }, []);

    const fetchActivities = async (page: number) => {
        setLoading(true);
        try {
            const response = await getActivityHistory(page, 10);
            if (response.status === 'success') {
                setActivities(response.data.activities);
                setPagination({
                    totalCount: response.data.totalCount,
                    totalPages: response.data.totalPages,
                    currentPage: response.data.currentPage
                });
            } else {
                throw new Error(response.message || 'Failed to load activity history');
            }
        } catch (err: any) {
            setError(err.message || 'Error loading activity history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;

        return (
            <nav aria-label="Activity pagination" className="mt-4">
                <ul className="pagination justify-content-center">
                    <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                            className="page-link"
                            onClick={() => fetchActivities(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                        >
                            Previous
                        </button>
                    </li>
                    {[...Array(pagination.totalPages)].map((_, i) => (
                        <li 
                            key={i} 
                            className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}
                        >
                            <button 
                                className="page-link"
                                onClick={() => fetchActivities(i + 1)}
                            >
                                {i + 1}
                            </button>
                        </li>
                    ))}
                    <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                        <button 
                            className="page-link"
                            onClick={() => fetchActivities(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        );
    };

    const getActivityIcon = (activityType: string) => {
        switch (activityType) {
            case 'LOGIN': return 'bi-box-arrow-in-right';
            case 'LOGOUT': return 'bi-box-arrow-right';
            case 'PASSWORD_CHANGE': return 'bi-key';
            case 'SECURITY_CHANGE': return 'bi-shield-check';
            case 'EMAIL_CHANGE': return 'bi-envelope';
            case 'PROFILE_UPDATE': return 'bi-person';
            default: return 'bi-clock-history';
        }
    };

    return (
        <div className="activity-history-container">
            <div className="page-header">
                <h2>Activity History</h2>
                <p className="text-muted">View your recent account activities</p>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}

            <div className="content-panel">
                {loading ? (
                    <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : activities.length > 0 ? (
                    <>
                        <div className="activity-list">
                            {activities.map(activity => (
                                <div key={activity.id} className="activity-item">
                                    <div className="activity-icon">
                                        <i className={`bi ${getActivityIcon(activity.activity_type)}`}></i>
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-header">
                                            <h5>{activity.activity_type.replace(/_/g, ' ')}</h5>
                                            <span className="activity-time">
                                                {formatDate(activity.createdAt)}
                                            </span>
                                        </div>
                                        <p className="activity-message">
                                            {activity.details?.message || 'Activity recorded'}
                                        </p>
                                        {activity.ip_address && (
                                            <div className="activity-details">
                                                <span className="badge bg-light text-dark me-2">
                                                    <i className="bi bi-globe me-1"></i>
                                                    IP: {activity.ip_address}
                                                </span>
                                                {activity.user_agent && (
                                                    <span className="badge bg-light text-dark">
                                                        <i className="bi bi-display me-1"></i>
                                                        {activity.user_agent.substring(0, 50)}
                                                        {activity.user_agent.length > 50 ? '...' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {renderPagination()}
                    </>
                ) : (
                    <div className="text-center p-5">
                        <i className="bi bi-clock-history text-muted display-4"></i>
                        <p className="text-muted mt-3">No activity recorded yet</p>
                    </div>
                )}

                <div className="mt-4">
                    <button 
                        className="btn btn-outline-primary"
                        onClick={() => router.push('/profile')}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityPage;
