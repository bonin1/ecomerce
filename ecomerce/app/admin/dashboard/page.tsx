'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/admin/Sidebar/sidebar';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { apiClient } from '@/app/utils/apiClient';
import Cookies from 'js-cookie';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Box, Card, CardContent, Grid, Typography, CircularProgress, useTheme, Tabs, Tab } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import PeopleIcon from '@mui/icons-material/People';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface DashboardStats {
    totalUsers: number;
    totalProducts: number;
    totalCategories: number;
    totalOrders: number;
    totalRevenue: number;
    timeSeriesData: Array<{
        date: string;
        users: number;
        products: number;
        orders: number;
        revenue: number;
    }>;
    growth: {
        users: number;
        products: number;
        orders: number;
        revenue: number;
    };
}

interface OrderStatistics {
    dailyOrders: Array<{
        date: string;
        count: number;
        revenue: number;
    }>;
    ordersByStatus: Array<{
        status: string;
        count: number;
    }>;
    monthlyRevenue: Array<{
        month: string;
        revenue: number;
        count: number;
    }>;
    topProducts: Array<{
        product_id: number;
        product_name: string;
        total_quantity: number;
        total_revenue: number;
        'product.product_primary_image': string;
    }>;
    averageOrderValue: Array<{
        month: string;
        average: number;
    }>;
    customerStats: {
        totalCustomers: number;
        ordersPerCustomer: number;
    };
    paymentMethodStats: Array<{
        payment_method: string;
        count: number;
        total: number;
    }>;
}

interface FulfillmentStats {
    processingTimeStats: Array<{
        month: string;
        processing_hours: number;
    }>;
    fulfillmentStats: {
        totalOrdersShipped: number;
        fastProcessingOrders: number;
        fulfillmentRate: number;
    };
}

interface CustomerInsights {
    newCustomers: number;
    ordersByCustomerType: Array<{
        customer_type: string;
        order_count: number;
        total_revenue: number;
    }>;
    topCustomers: Array<{
        user_id: number;
        order_count: number;
        total_spent: number;
        user: {
            name: string;
            email: string;
        }
    }>;
}

const Dashboard = () => {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<any>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
    const [fulfillmentStats, setFulfillmentStats] = useState<FulfillmentStats | null>(null);
    const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    const theme = useTheme();

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

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
        fetchOrderStatistics();
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
        }
    };
    
    const fetchOrderStatistics = async () => {
        try {
            const [advancedStats, fulfillment, customers] = await Promise.all([
                apiClient('/admin/orders/statistics/advanced'),
                apiClient('/admin/orders/statistics/fulfillment'),
                apiClient('/admin/orders/statistics/customer-insights')
            ]);
            
            if (advancedStats.success) {
                setOrderStats(advancedStats.data);
            }
            
            if (fulfillment.success) {
                setFulfillmentStats(fulfillment.data);
            }
            
            if (customers.success) {
                setCustomerInsights(customers.data);
            }
        } catch (error) {
            console.error('Error fetching order statistics:', error);
        }
    };

    const lineChartOptions = {
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

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            }
        },
        cutout: '70%'
    };

    if (!adminUser || loading) return <CircularProgress />;

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main" style={{ marginLeft: '250px', padding: '2rem' }}>
                <Typography variant="h4" gutterBottom>
                    Welcome, {adminUser.name}
                </Typography>

                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ mb: 3 }}
                >
                    <Tab label="Overview" />
                    <Tab label="Order Analytics" />
                    <Tab label="Customer Insights" />
                </Tabs>

                {tabValue === 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <StatsCard
                                title="Total Users"
                                value={stats?.totalUsers || 0}
                                growth={stats?.growth.users || 0}
                                icon={<PeopleIcon color="primary" />}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StatsCard
                                title="Total Products"
                                value={stats?.totalProducts || 0}
                                growth={stats?.growth.products || 0}
                                icon={<ShoppingBasketIcon sx={{ color: '#f43f5e' }} />}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StatsCard
                                title="Total Orders"
                                value={stats?.totalOrders || 0}
                                growth={stats?.growth.orders || 0}
                                icon={<LocalShippingIcon sx={{ color: '#0ea5e9' }} />}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StatsCard
                                title="Revenue"
                                value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
                                growth={stats?.growth.revenue || 0}
                                icon={<AttachMoneyIcon sx={{ color: '#10b981' }} />}
                            />
                        </Grid>

                        <Grid item xs={12}>
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
                                                },
                                                {
                                                    label: 'Orders',
                                                    data: stats?.timeSeriesData.map(d => d.orders) || [],
                                                    borderColor: '#0ea5e9',
                                                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                                                    fill: true,
                                                    cubicInterpolationMode: 'monotone'
                                                },
                                                {
                                                    label: 'Revenue ($)',
                                                    data: stats?.timeSeriesData.map(d => d.revenue) || [],
                                                    borderColor: '#10b981',
                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                    fill: true,
                                                    cubicInterpolationMode: 'monotone'
                                                }
                                            ]
                                        }}
                                    />
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {tabValue === 1 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <StatsCard
                                title="Total Orders"
                                value={stats?.totalOrders || 0}
                                growth={stats?.growth.orders || 0}
                                icon={<LocalShippingIcon sx={{ color: '#0ea5e9' }} />}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <StatsCard
                                title="Total Revenue"
                                value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
                                growth={stats?.growth.revenue || 0}
                                icon={<AttachMoneyIcon sx={{ color: '#10b981' }} />}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Fulfillment Rate
                                    </Typography>
                                    <Typography variant="h4">
                                        {fulfillmentStats?.fulfillmentStats.fulfillmentRate || 0}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {fulfillmentStats?.fulfillmentStats.fastProcessingOrders || 0} orders processed in less than 24h
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={8}>
                            <Card sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Orders & Revenue Trends</Typography>
                                <Box sx={{ height: 350 }}>
                                    <Line
                                        data={{
                                            labels: orderStats?.dailyOrders.map(d => {
                                                const date = new Date(d.date);
                                                return date.toLocaleDateString('en-US', { 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                });
                                            }) || [],
                                            datasets: [
                                                {
                                                    label: 'Orders',
                                                    data: orderStats?.dailyOrders.map(d => d.count) || [],
                                                    borderColor: '#0ea5e9',
                                                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                                                    fill: true
                                                },
                                                {
                                                    label: 'Revenue ($)',
                                                    data: orderStats?.dailyOrders.map(d => d.revenue) || [],
                                                    borderColor: '#10b981',
                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                    fill: true
                                                }
                                            ]
                                        }}
                                    />
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Order Status Distribution</Typography>
                                <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Doughnut
                                        options={doughnutOptions}
                                        data={{
                                            labels: orderStats?.ordersByStatus.map(item => 
                                                item.status.charAt(0).toUpperCase() + item.status.slice(1)
                                            ) || [],
                                            datasets: [
                                                {
                                                    data: orderStats?.ordersByStatus.map(item => item.count) || [],
                                                    backgroundColor: [
                                                        '#3b82f6', 
                                                        '#f59e0b', 
                                                        '#10b981',
                                                        '#6366f1', 
                                                        '#ef4444'  
                                                    ],
                                                    borderWidth: 0
                                                }
                                            ]
                                        }}
                                    />
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Monthly Revenue</Typography>
                                <Box sx={{ height: 300 }}>
                                    <Bar
                                        data={{
                                            labels: orderStats?.monthlyRevenue.map(item => item.month) || [],
                                            datasets: [
                                                {
                                                    label: 'Revenue',
                                                    data: orderStats?.monthlyRevenue.map(item => item.revenue) || [],
                                                    backgroundColor: '#10b981',
                                                    borderRadius: 4
                                                }
                                            ]
                                        }}
                                    />
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Payment Method Analysis</Typography>
                                <Box sx={{ height: 300 }}>
                                    <Pie
                                        data={{
                                            labels: orderStats?.paymentMethodStats.map(item => 
                                                item.payment_method
                                            ) || [],
                                            datasets: [
                                                {
                                                    data: orderStats?.paymentMethodStats.map(item => {
                                                        // Safely handle the total value whether it's a string or number
                                                        const total = item.total;
                                                        return typeof total === 'string' ? parseFloat(total) : total;
                                                    }) || [],
                                                    backgroundColor: [
                                                        '#3b82f6',
                                                        '#f59e0b',
                                                        '#10b981',
                                                        '#6366f1',
                                                        '#ef4444'
                                                    ],
                                                    borderWidth: 0
                                                }
                                            ]
                                        }}
                                    />
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item xs={12}>
                            <Card sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Top Selling Products</Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Product</th>
                                                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Units Sold</th>
                                                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderStats?.topProducts.map((product, index) => (
                                                <tr key={index} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                            {product['product.product_primary_image'] && (
                                                                <img 
                                                                    src={product['product.product_primary_image']} 
                                                                    alt={product.product_name}
                                                                    style={{ width: 40, height: 40, marginRight: 12, objectFit: 'cover', borderRadius: 4 }}
                                                                />
                                                            )}
                                                            <div>
                                                                {product.product_name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                                                        {product.total_quantity}
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                                                        ${typeof product.total_revenue === 'string' 
                                                            ? parseFloat(product.total_revenue).toFixed(2)
                                                            : product.total_revenue.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {tabValue === 2 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Customers
                                    </Typography>
                                    <Typography variant="h4">
                                        {orderStats?.customerStats?.totalCustomers || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {customerInsights?.newCustomers || 0} new customers in the past 6 months
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Orders Per Customer
                                    </Typography>
                                    <Typography variant="h4">
                                        {orderStats?.customerStats?.ordersPerCustomer || '0'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Average number of orders per customer
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Average Order Value
                                    </Typography>
                                    <Typography variant="h4">
                                        ${orderStats?.averageOrderValue && orderStats.averageOrderValue.length > 0 
                                            ? Number(orderStats.averageOrderValue[orderStats.averageOrderValue.length - 1].average).toFixed(2)
                                            : '0.00'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Average value of each order
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={5}>
                            <Card sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>New vs Returning Customers</Typography>
                                <Box sx={{ height: 300 }}>
                                    <Pie
                                        data={{
                                            labels: customerInsights?.ordersByCustomerType.map(item => 
                                                item.customer_type === 'new' ? 'New Customers' : 'Returning Customers'
                                            ) || [],
                                            datasets: [
                                                {
                                                    data: customerInsights?.ordersByCustomerType.map(item => Number(item.order_count)) || [],
                                                    backgroundColor: ['#3b82f6', '#10b981'],
                                                    borderWidth: 0
                                                }
                                            ]
                                        }}
                                    />
                                </Box>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={7}>
                            <Card sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Average Order Value Trend</Typography>
                                <Box sx={{ height: 300 }}>
                                    <Line
                                        data={{
                                            labels: orderStats?.averageOrderValue.map(item => item.month) || [],
                                            datasets: [
                                                {
                                                    label: 'Avg. Order Value',
                                                    data: orderStats?.averageOrderValue.map(item => Number(item.average)) || [],
                                                    borderColor: '#6366f1',
                                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                    fill: true
                                                }
                                            ]
                                        }}
                                    />
                                </Box>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Card sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Top Customers</Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Customer</th>
                                                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Orders</th>
                                                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Total Spent</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customerInsights?.topCustomers.map((customer, index) => (
                                                <tr key={index} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div>
                                                            <Typography fontWeight="medium">{customer.user.name}</Typography>
                                                            <Typography variant="body2" color="text.secondary">{customer.user.email}</Typography>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                                                        {customer.order_count}
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                                                        ${typeof customer.total_spent === 'string' 
                                                            ? parseFloat(customer.total_spent).toFixed(2)
                                                            : customer.total_spent.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </main>
        </div>
    );
};

const StatsCard = ({ title, value, growth, icon }: { title: string, value: number | string, growth?: number, icon?: React.ReactNode }) => (
    <Card>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                    {title}
                </Typography>
                {icon}
            </Box>
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
