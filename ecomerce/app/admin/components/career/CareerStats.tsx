'use client';
import React, { useEffect, useState } from 'react';
import { CareerStats } from '@/app/types';
import { apiClient } from '@/app/utils/apiClient';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const CareerStatsDashboard: React.FC = () => {
    const [stats, setStats] = useState<CareerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await apiClient('/careers/stats');
                if (response.success) {
                    setStats(response.data);
                } else {
                    setError('Failed to load career statistics');
                }
            } catch (err) {
                console.error('Error fetching career stats:', err);
                setError('Failed to load career statistics. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statsItems = [
        {
            title: 'Total Job Listings',
            value: stats?.careers.total || 0,
            icon: <WorkIcon sx={{ fontSize: 40, color: '#3b82f6' }} />,
            color: '#3b82f6'
        },
        {
            title: 'Active Jobs',
            value: stats?.careers.active || 0,
            icon: <CheckCircleIcon sx={{ fontSize: 40, color: '#10b981' }} />,
            color: '#10b981'
        },
        {
            title: 'Total Applications',
            value: stats?.applications.total || 0,
            icon: <PeopleIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />,
            color: '#8b5cf6'
        },
        {
            title: 'Pending Applications',
            value: stats?.applications.pending || 0,
            icon: <HourglassEmptyIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
            color: '#f59e0b'
        }
    ];

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
                Careers Dashboard
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statsItems.map((item, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            height: '100%',
                            borderTop: `4px solid ${item.color}` 
                        }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography color="text.secondary" variant="subtitle2">
                                            {item.title}
                                        </Typography>
                                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600 }}>
                                            {item.value}
                                        </Typography>
                                    </Box>
                                    {item.icon}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>
                            Job Listings Status
                        </Typography>
                        <Box height={300} display="flex" justifyContent="center">
                            <Doughnut 
                                data={{
                                    labels: ['Active', 'Inactive'],
                                    datasets: [
                                        {
                                            data: [
                                                stats?.careers.active || 0,
                                                stats?.careers.inactive || 0
                                            ],
                                            backgroundColor: [
                                                '#10b981',
                                                '#9ca3af'
                                            ],
                                            borderWidth: 0
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom'
                                        }
                                    },
                                    cutout: '70%'
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>
                            Application Status Distribution
                        </Typography>
                        <Box height={300}>
                            <Bar
                                data={{
                                    labels: ['Pending', 'Approved', 'Rejected'],
                                    datasets: [
                                        {
                                            label: 'Applications',
                                            data: [
                                                stats?.applications.pending || 0,
                                                stats?.applications.approved || 0,
                                                stats?.applications.rejected || 0
                                            ],
                                            backgroundColor: [
                                                '#f59e0b',
                                                '#10b981',
                                                '#ef4444'
                                            ],
                                            borderRadius: 6
                                        }
                                    ]
                                }}
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
                                            beginAtZero: true,
                                            grid: {
                                                display: false
                                            }
                                        },
                                        x: {
                                            grid: {
                                                display: false
                                            }
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

export default CareerStatsDashboard;
