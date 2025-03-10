'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/admin/Sidebar/sidebar';
import { Line, Bar } from 'react-chartjs-2';
import { apiClient } from '@/app/utils/apiClient';
import Cookies from 'js-cookie';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Box, Card, CardContent, Grid, Typography, CircularProgress, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface DashboardStats {
    totalUsers: number;
    totalProducts: number;
    totalCategories: number;
    timeSeriesData: Array<{
        date: string;
        users: number;
        products: number;
    }>;
    growth: {
        users: number;
        products: number;
    };
}

const Dashboard = () => {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<any>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const theme = useTheme();

    useEffect(() => {
        const user = localStorage.getItem('adminUser');
        const token = localStorage.getItem('adminToken');
        
        if (!user || !token) {
            router.push('/admin/login');
            return;
        }

        const syncCookie = Cookies.get('adminTokenSync');
        if (token && !syncCookie) {
            Cookies.set('adminTokenSync', token, {
                expires: 1/6, 
                path: '/',
                sameSite: 'Strict'
            });
        }
        
        setAdminUser(JSON.parse(user));
        fetchDashboardStats();
    }, [router]);

    const fetchDashboardStats = async () => {
        try {
            const response = await apiClient('/admin/dashboard/stats');
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }  };    const lineChartOptions = {
        responsive: true,
        interaction: {
            mode: 'index' as const,
            intersect: false,
            axis: 'x' as const
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12,
                        weight: '500'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1a1a1a',
                bodyColor: '#666666',
                bodyFont: {
                    family: "'Inter', sans-serif"
                },
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: function(context: any) {
                        return `${context.dataset.label}: ${context.parsed.y}`;
                    }
                }
            },
            title: {
                display: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                grid: {
                    borderDash: [4, 4],
                    color: 'rgba(0,0,0,0.05)'
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    padding: 10
                },
                beginAtZero: true
            }
        },
        elements: {
            line: {
                tension: 0.4,
                borderWidth: 2,
                fill: true
            },
            point: {
                radius: 0,
                hoverRadius: 6,
                hitRadius: 30
            }
        }
    };

    if (!adminUser || loading) return <CircularProgress />;

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main" style={{ marginLeft: '250px', padding: '2rem' }}>
                <Typography variant="h4" gutterBottom>
                    Welcome, {adminUser.name}
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <StatsCard
                            title="Total Users"
                            value={stats?.totalUsers || 0}
                            growth={stats?.growth.users || 0}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatsCard
                            title="Total Products"
                            value={stats?.totalProducts || 0}
                            growth={stats?.growth.products || 0}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatsCard
                            title="Categories"
                            value={stats?.totalCategories || 0}
                        />
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Card sx={{
                            background: 'linear-gradient(to bottom right, #ffffff, #fafafa)',
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            p: 3
                        }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Growth Overview
                            </Typography>
                            <Box sx={{ height: 400, position: 'relative' }}>
                                <Line
                                    data={{
                                        labels: stats?.timeSeriesData.map(d => {
                                            const date = new Date(d.date);
                                            return date.toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric' 
                                            });
                                        }) || [],
                                        datasets: [
                                            {
                                                label: 'Users',
                                                data: stats?.timeSeriesData.map(d => d.users) || [],
                                                borderColor: '#6366f1',
                                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                fill: true,
                                                cubicInterpolationMode: 'monotone'
                                            },
                                            {
                                                label: 'Products',
                                                data: stats?.timeSeriesData.map(d => d.products) || [],
                                                borderColor: '#f43f5e',
                                                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                                                fill: true,
                                                cubicInterpolationMode: 'monotone'
                                            }
                                        ]
                                    }}
                                />
                            </Box>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            background: 'linear-gradient(to bottom right, #ffffff, #fafafa)',
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            p: 3,
                            height: '100%'
                        }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Distribution
                            </Typography>
                            <Box sx={{ height: 400, display: 'flex', alignItems: 'center' }}>
                                <Bar
                                    data={{
                                        labels: ['Total'],
                                        datasets: [
                                            {
                                                label: 'Users',
                                                data: [stats?.totalUsers || 0],
                                                backgroundColor: '#6366f1',
                                                borderRadius: 6
                                            },
                                            {
                                                label: 'Products',
                                                data: [stats?.totalProducts || 0],
                                                backgroundColor: '#f43f5e',
                                                borderRadius: 6
                                            }
                                        ]
                                    }}
                                />
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </main>
        </div>
    );
};

const StatsCard = ({ title, value, growth }: { title: string, value: number, growth?: number }) => (
    <Card>
        <CardContent>
            <Typography color="textSecondary" gutterBottom>
                {title}
            </Typography>
            <Typography variant="h4">
                {value}
            </Typography>
            {growth !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {growth >= 0 ? (
                        <TrendingUpIcon color="success" />
                    ) : (
                        <TrendingDownIcon color="error" />
                    )}
                    <Typography
                        color={growth >= 0 ? 'success.main' : 'error.main'}
                        sx={{ ml: 1 }}
                    >
                        {Math.abs(growth).toFixed(1)}% {growth >= 0 ? 'increase' : 'decrease'}
                    </Typography>
                </Box>
            )}
        </CardContent>
    </Card>
);

export default Dashboard;
