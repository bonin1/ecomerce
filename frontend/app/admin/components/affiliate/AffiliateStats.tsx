'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
    Box, 
    Grid, 
    Paper, 
    Typography, 
    Card, 
    CardContent,
    CircularProgress,
    Alert
} from '@mui/material';
import { 
    People as PeopleIcon,
    HourglassEmpty as PendingIcon,
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
    Block as SuspendedIcon,
    AttachMoney as EarningsIcon,
    Mouse as ClicksIcon,
    TrendingUp as ConversionsIcon
} from '@mui/icons-material';
import { ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart as ChartJS } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { apiClient } from '../../../utils/apiClient';
import { AffiliateStats } from '../../../types';
import { SITE_NAME } from '@/app/config/site';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const AffiliateStatsDashboard: React.FC = () => {
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
            const response = (await apiClient('/affiliate/admin/stats')) as {
                success?: boolean;
                data?: AffiliateStats;
                message?: string;
            };
            if (response.success && response.data) {
                setStats(response.data);
            } else {
                setError(response.message || 'Failed to fetch affiliate statistics');
            }
            } catch (err) {
                console.error('Error fetching affiliate stats:', err);
                setError('Failed to load affiliate statistics. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statsItems = [
        {
            title: 'Total Affiliates',
            value: stats?.totalAffiliates || 0,
            icon: <PeopleIcon sx={{ fontSize: 40, color: '#3b82f6' }} />,
            color: '#3b82f6'
        },
        {
            title: 'Pending Applications',
            value: stats?.pendingAffiliates || 0,
            icon: <PendingIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
            color: '#f59e0b'
        },
        {
            title: 'Approved Affiliates',
            value: stats?.approvedAffiliates || 0,
            icon: <ApprovedIcon sx={{ fontSize: 40, color: '#10b981' }} />,
            color: '#10b981'
        },
        {
            title: 'Total Earnings',
            value: `$${Number(stats?.totalEarnings ?? 0).toFixed(2)}`,
            icon: <EarningsIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />,
            color: '#8b5cf6'
        },
        {
            title: 'Total Clicks',
            value: stats?.totalClicks || 0,
            icon: <ClicksIcon sx={{ fontSize: 40, color: '#06b6d4' }} />,
            color: '#06b6d4'
        },
        {
            title: 'Conversion Rate',
            value: `${stats?.conversionRate || 0}%`,
            icon: <ConversionsIcon sx={{ fontSize: 40, color: '#ec4899' }} />,
            color: '#ec4899'
        }
    ];

    const statusChartData = useMemo(
        () => ({
            labels: ['Pending', 'Approved', 'Rejected', 'Suspended'],
            datasets: [
                {
                    data: [
                        stats?.pendingAffiliates || 0,
                        stats?.approvedAffiliates || 0,
                        stats?.rejectedAffiliates || 0,
                        stats?.suspendedAffiliates || 0,
                    ],
                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#6b7280'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                },
            ],
        }),
        [stats]
    );

    const performanceChartData = useMemo(
        () => ({
            labels: ['Clicks', 'Conversions'],
            datasets: [
                {
                    label: 'Performance metrics',
                    data: [stats?.totalClicks || 0, stats?.totalConversions || 0],
                    backgroundColor: ['#06b6d4', '#ec4899'],
                    borderColor: ['#0891b2', '#db2777'],
                    borderWidth: 1,
                },
            ],
        }),
        [stats]
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ mb: 4, width: '100%' }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
                {SITE_NAME} — affiliate overview
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statsItems.map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box>{item.icon}</Box>
                                <Box>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: item.color }}>
                                        {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {item.title}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2, height: '400px' }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Affiliate Status Distribution
                        </Typography>
                        <Box sx={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Doughnut 
                                data={statusChartData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom'
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2, height: '400px' }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Performance Overview
                        </Typography>
                        <Box sx={{ height: '300px' }}>
                            <Bar 
                                data={performanceChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AffiliateStatsDashboard;
