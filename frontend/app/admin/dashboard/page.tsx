'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
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
import { Box, Card, CardContent, Grid, Typography, CircularProgress } from '@mui/material';
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
    operations?: {
        pendingReviews: number;
        lowStockProducts: number;
        outOfStockProducts: number;
        ordersPending: number;
        ordersProcessing: number;
        ordersShipped: number;
        affiliatePending: number;
        affiliateApproved: number;
        affiliateRejected: number;
        affiliateSuspended: number;
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
    const [adminUser, setAdminUser] = useState<any>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = localStorage.getItem('adminUser');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
    const [fulfillmentStats, setFulfillmentStats] = useState<FulfillmentStats | null>(null);
    const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (newValue: number) => {
        setTabValue(newValue);
    };

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, advancedStats, fulfillment, customers] = await Promise.all([
                apiClient('/admin/dashboard/stats'),
                apiClient('/admin/orders/statistics/advanced'),
                apiClient('/admin/orders/statistics/fulfillment'),
                apiClient('/admin/orders/statistics/customer-insights'),
            ]);

            const dash = dashRes as { success?: boolean; data?: DashboardStats };
            if (dash.success && dash.data) {
                setStats(dash.data);
            }

            if ((advancedStats as { success?: boolean }).success) {
                setOrderStats((advancedStats as { data: OrderStatistics }).data);
            }

            if ((fulfillment as { success?: boolean }).success) {
                setFulfillmentStats((fulfillment as { data: FulfillmentStats }).data);
            }

            if ((customers as { success?: boolean }).success) {
                setCustomerInsights((customers as { data: CustomerInsights }).data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        const syncCookie = Cookies.get('adminTokenSync');
        if (token && !syncCookie) {
            Cookies.set('adminTokenSync', token, {
                expires: 1 / 6,
                path: '/',
                sameSite: 'Strict',
            });
        }

        try {
            const raw = localStorage.getItem('adminUser');
            if (raw) setAdminUser(JSON.parse(raw));
        } catch {
            router.push('/admin/login');
            return;
        }

        void loadDashboard();
    }, [router, loadDashboard]);

    const growthChartData = useMemo(() => {
        const series = stats?.timeSeriesData ?? [];
        const labels = series.map((d) => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
        });
        return {
            labels,
            datasets: [
                {
                    label: 'Users',
                    data: series.map((d) => d.users),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    cubicInterpolationMode: 'monotone' as const,
                },
                {
                    label: 'Products',
                    data: series.map((d) => d.products),
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    fill: true,
                    cubicInterpolationMode: 'monotone' as const,
                },
                {
                    label: 'Orders',
                    data: series.map((d) => d.orders),
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    fill: true,
                    cubicInterpolationMode: 'monotone' as const,
                },
                {
                    label: 'Revenue ($)',
                    data: series.map((d) => d.revenue),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    cubicInterpolationMode: 'monotone' as const,
                },
            ],
        };
    }, [stats?.timeSeriesData]);

    const staffRole = String(adminUser?.role || '').toLowerCase() === 'staff';

    const quickNavItems = useMemo(
        () =>
            [
                { href: '/admin/products', title: 'Products', desc: 'Catalog, pricing, media', icon: 'bi-box-seam' },
                { href: '/admin/categories', title: 'Categories', desc: 'Browse taxonomy', icon: 'bi-tags' },
                { href: '/admin/orders', title: 'Orders', desc: 'Fulfillment & payments', icon: 'bi-receipt' },
                { href: '/admin/reviews', title: 'Reviews', desc: 'Moderation queue', icon: 'bi-chat-square-text' },
                { href: '/admin/customers', title: 'Customers', desc: 'Profiles & history', icon: 'bi-person-badge' },
                ...(!staffRole
                    ? [{ href: '/admin/affiliate', title: 'Affiliates', desc: 'Partners & payouts', icon: 'bi-share' } as const]
                    : []),
            ],
        [staffRole]
    );

    const operationsTiles = useMemo(() => {
        const op = stats?.operations;
        const base = [
            { label: 'Reviews pending', value: op?.pendingReviews ?? 0, href: '/admin/reviews' },
            { label: 'Low stock (1–10)', value: op?.lowStockProducts ?? 0, href: '/admin/products' },
            { label: 'Out of stock', value: op?.outOfStockProducts ?? 0, href: '/admin/products' },
            {
                label: 'Orders (pending / proc. / ship)',
                value: `${op?.ordersPending ?? 0} / ${op?.ordersProcessing ?? 0} / ${op?.ordersShipped ?? 0}`,
                href: '/admin/orders',
            },
        ];
        if (staffRole) return base;
        return [
            ...base,
            { label: 'Affiliate apps pending', value: op?.affiliatePending ?? 0, href: '/admin/affiliate' },
            { label: 'Active affiliates', value: op?.affiliateApproved ?? 0, href: '/admin/affiliate' },
            { label: 'Affiliate rejected', value: op?.affiliateRejected ?? 0, href: '/admin/affiliate' },
            { label: 'Affiliate suspended', value: op?.affiliateSuspended ?? 0, href: '/admin/affiliate' },
        ];
    }, [stats?.operations, staffRole]);

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
                        weight: 500 as const,
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
        },
        animation: {
            duration: 400,
        },
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

    if (!adminUser) {
        return (
            <div className="flex min-h-screen bg-slate-50">
                <Sidebar />
                <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary">
                        Loading session…
                    </Typography>
                </main>
            </div>
        );
    }

    if (loading && !stats) {
        return (
            <div className="flex min-h-screen bg-slate-50">
                <Sidebar />
                <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary">
                        Loading dashboard data…
                    </Typography>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden bg-slate-100/90">
                <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 md:py-10">
                    <header className="border-b border-slate-200/90 pb-8">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                            Welcome, {adminUser.name}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                            Revenue, catalog health, fulfillment, and shortcuts to the screens you use most.
                        </p>
                    </header>

                    <div
                        className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
                        role="tablist"
                        aria-label="Dashboard sections"
                    >
                        {(['Overview', 'Order analytics', 'Customer insights'] as const).map((label, i) => (
                            <button
                                key={label}
                                type="button"
                                role="tab"
                                aria-selected={tabValue === i}
                                onClick={() => handleTabChange(i)}
                                className={`min-w-[120px] flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition sm:min-w-[160px] md:flex-none ${
                                    tabValue === i
                                        ? 'bg-brand-primary text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                {tabValue === 0 && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatsCard
                                title="Total Users"
                                value={stats?.totalUsers || 0}
                                growth={stats?.growth.users || 0}
                                icon={<PeopleIcon color="primary" />}
                            />
                            <StatsCard
                                title="Total Products"
                                value={stats?.totalProducts || 0}
                                growth={stats?.growth.products || 0}
                                icon={<ShoppingBasketIcon sx={{ color: '#f43f5e' }} />}
                            />
                            <StatsCard
                                title="Total Orders"
                                value={stats?.totalOrders || 0}
                                growth={stats?.growth.orders || 0}
                                icon={<LocalShippingIcon sx={{ color: '#0ea5e9' }} />}
                            />
                            <StatsCard
                                title="Revenue"
                                value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
                                growth={stats?.growth.revenue || 0}
                                icon={<AttachMoneyIcon sx={{ color: '#10b981' }} />}
                            />
                        </div>

                        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.02]">
                            <Card sx={{ borderRadius: 0, boxShadow: 'none' }}>
                                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        Operations overview
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Live counts for reviews, inventory, pipeline orders, and affiliates.
                                    </Typography>
                                </Box>
                                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {operationsTiles.map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-4 no-underline transition hover:border-indigo-300 hover:bg-white hover:shadow-sm"
                                        >
                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 group-hover:text-indigo-600">
                                                {item.label}
                                            </span>
                                            <span className="mt-2 text-2xl font-bold text-slate-900">{item.value}</span>
                                            <span className="mt-2 text-xs font-medium text-indigo-600">Open →</span>
                                        </Link>
                                    ))}
                                </div>
                            </Card>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.02]">
                            <Card sx={{ borderRadius: 0, boxShadow: 'none' }}>
                                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        Quick navigation
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Jump to the areas you manage most often.
                                    </Typography>
                                </Box>
                                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {quickNavItems.map((q) => (
                                        <Link
                                            key={q.href}
                                            href={q.href}
                                            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 no-underline shadow-sm transition hover:border-indigo-400 hover:shadow-md"
                                        >
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                <i className={`bi ${q.icon} text-lg`} aria-hidden />
                                            </span>
                                            <span>
                                                <span className="block text-sm font-bold text-slate-900">{q.title}</span>
                                                <span className="mt-0.5 block text-xs text-slate-500">{q.desc}</span>
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </Card>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.02] md:p-6">
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Growth overview
                            </Typography>
                            <Box sx={{ height: 400, position: 'relative' }}>
                                <Line data={growthChartData} options={lineChartOptions} />
                            </Box>
                        </section>
                    </div>
                )}

                {tabValue === 1 && (
                    <div className="space-y-8">
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
                    </div>
                )}

                {tabValue === 2 && (
                    <div className="space-y-8">
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
                    </div>
                )}
                </div>
            </main>
        </div>
    );
};

const StatsCard = ({
    title,
    value,
    growth,
    icon,
}: {
    title: string;
    value: number | string;
    growth?: number;
    icon?: React.ReactNode;
}) => (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.02]">
        <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 [&_svg]:text-current">
                {icon}
            </span>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{value}</p>
        {growth !== undefined && (
            <div
                className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${
                    growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
            >
                {growth >= 0 ? <TrendingUpIcon sx={{ fontSize: 18 }} /> : <TrendingDownIcon sx={{ fontSize: 18 }} />}
                <span>{Math.abs(growth).toFixed(1)}% vs prior period</span>
            </div>
        )}
    </div>
);

export default Dashboard;
