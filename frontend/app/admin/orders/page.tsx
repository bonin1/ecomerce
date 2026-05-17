'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import { apiClient } from '@/app/utils/apiClient';
import { generateTrackingCode } from '@/app/utils/trackingCodeGenerator';
import { SITE_NAME } from '@/app/config/site';
import toast from 'react-hot-toast';
import { 
    Box, 
    Button, 
    Card, 
    Container, 
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
    Chip,
    CircularProgress,
    Alert,
    Tooltip,
} from '@mui/material';
import { 
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    FilterList as FilterListIcon,
    Refresh as RefreshIcon,
    Autorenew as AutorenewIcon,
    Lock as LockIcon,
    Print as PrintIcon,
} from '@mui/icons-material';

type DatePreset = 'all' | 'today' | '7d' | '30d' | 'custom';

function localYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function rangeForPreset(preset: Exclude<DatePreset, 'all' | 'custom'>): { from: string; to: string } {
    const now = new Date();
    const to = localYmd(now);
    if (preset === 'today') {
        return { from: to, to };
    }
    const start = new Date(now);
    const days = preset === '7d' ? 6 : 29;
    start.setDate(start.getDate() - days);
    return { from: localYmd(start), to };
}

function escapeHtml(s: string) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    total_price: number;
    shipped_quantity?: number;
    product: {
        id: number;
        product_name: string;
        product_primary_image: string;
        product_price: number;
    };
}

interface AdminOrderNoteRow {
    id: number;
    body: string;
    createdAt: string;
    author_user_id?: number;
}

interface OrderShipmentRow {
    id: number;
    tracking_number: string;
    carrier?: string | null;
    notes?: string | null;
    createdAt: string;
}

interface Order {
    id: number;
    order_number: string;
    user_id: number;
    status: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    createdAt: string;
    updatedAt: string;
    shipping_address: string;
    shipping_city: string;
    shipping_postal_code: string;
    shipping_country: string;
    contact_phone: string;
    contact_email: string;
    tracking_number?: string;
    estimated_delivery_date?: string;
    respond_by?: string | null;
    ship_by?: string | null;
    coupon_code?: string | null;
    discount_amount?: number | string;
    user: {
        id: number;
        name: string;
        email: string;
        phone_number?: string;
    };
    items: OrderItem[];
}

const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444'
};

const paymentStatusColors: Record<string, string> = {
    pending: '#f59e0b',
    paid: '#10b981',
    failed: '#ef4444',
    refunded: '#6b7280'
};

const OrdersManagement = () => {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('DESC');
    
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [openOrderDialog, setOpenOrderDialog] = useState(false);
    const [processingUpdate, setProcessingUpdate] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    const [trackingNumber, setTrackingNumber] = useState('');
    const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
    const [updateTrackingMode, setUpdateTrackingMode] = useState(false);

    const [autoGenerateTracking, setAutoGenerateTracking] = useState(true);
    const [trackingLocked, setTrackingLocked] = useState(false);

    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [dateCustomFrom, setDateCustomFrom] = useState('');
    const [dateCustomTo, setDateCustomTo] = useState('');

    const [orderOpsNotes, setOrderOpsNotes] = useState<AdminOrderNoteRow[]>([]);
    const [orderShipments, setOrderShipments] = useState<OrderShipmentRow[]>([]);
    const [orderNoteDraft, setOrderNoteDraft] = useState('');
    const [partialShipInput, setPartialShipInput] = useState<Record<number, string>>({});
    const [adminPanelRole, setAdminPanelRole] = useState('');

    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
        return () => clearTimeout(id);
    }, [searchTerm]);

    useEffect(() => {
        setPage(0);
    }, [debouncedSearch]);

    // Auth check
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin/login');
        }
    }, [router]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('adminUser');
            const u = raw ? (JSON.parse(raw) as { role?: string }) : {};
            setAdminPanelRole(String(u?.role || ''));
        } catch {
            setAdminPanelRole('');
        }
    }, []);

    const canEditShippedQty = ['admin', 'superadmin'].includes(adminPanelRole);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: String(page + 1),
                limit: String(rowsPerPage),
                sortBy,
                order: sortOrder,
            });

            if (statusFilter !== 'all') {
                queryParams.append('status', statusFilter);
            }

            if (debouncedSearch) {
                queryParams.append('search', debouncedSearch);
            }

            if (datePreset === 'custom') {
                if (dateCustomFrom) queryParams.append('date_from', dateCustomFrom);
                if (dateCustomTo) queryParams.append('date_to', dateCustomTo);
            } else if (datePreset !== 'all') {
                const r = rangeForPreset(datePreset);
                queryParams.append('date_from', r.from);
                queryParams.append('date_to', r.to);
            }

            const response = (await apiClient(`/admin/orders?${queryParams.toString()}`)) as {
                success?: boolean;
                data?: {
                    orders: Order[];
                    totalItems: number;
                    statusCounts?: Record<string, number>;
                };
            };
            
            if (response.success && response.data) {
                setOrders(response.data.orders);
                setTotalItems(response.data.totalItems);
                if (response.data.statusCounts) {
                    setStatusCounts(response.data.statusCounts);
                }
            } else {
                setError('Failed to fetch orders');
            }
        } catch (err) {
            setError('Error loading orders. Please try again.');
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, statusFilter, sortBy, sortOrder, debouncedSearch, datePreset, dateCustomFrom, dateCustomTo]);

    useEffect(() => {
        void fetchOrders();
    }, [fetchOrders]);

    const exportOrdersCsv = () => {
        if (!orders.length) return;
        const esc = (v: string | number | undefined | null) => {
            const s = v === undefined || v === null ? '' : String(v);
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
        };
        const header = [
            'order_number',
            'status',
            'payment_status',
            'total_amount',
            'customer',
            'email',
            'createdAt',
        ];
        const lines = [
            header.join(','),
            ...orders.map((o) =>
                [
                    o.order_number,
                    o.status,
                    o.payment_status,
                    o.total_amount,
                    o.user?.name,
                    o.user?.email,
                    o.createdAt,
                ]
                    .map(esc)
                    .join(',')
            ),
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-page-${page + 1}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Pagination handlers
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const refreshOrderOpsExtras = async (orderId: number) => {
        try {
            const [notesRes, shipRes] = await Promise.all([
                apiClient(`/admin/ops/orders/${orderId}/notes`),
                apiClient(`/admin/ops/orders/${orderId}/shipments`),
            ]);
            const notesData = (notesRes as { success?: boolean; data?: AdminOrderNoteRow[] }).data;
            const shipData = (shipRes as { success?: boolean; data?: OrderShipmentRow[] }).data;
            setOrderOpsNotes(Array.isArray(notesData) ? notesData : []);
            setOrderShipments(Array.isArray(shipData) ? shipData : []);
        } catch {
            setOrderOpsNotes([]);
            setOrderShipments([]);
        }
    };

    const submitInternalOrderNote = async () => {
        if (!selectedOrder) return;
        const body = orderNoteDraft.trim();
        if (!body) {
            toast.error('Note cannot be empty');
            return;
        }
        try {
            setProcessingUpdate(true);
            const res = await apiClient(`/admin/ops/orders/${selectedOrder.id}/notes`, {
                method: 'POST',
                body: JSON.stringify({ body }),
            });
            if ((res as { success?: boolean }).success) {
                toast.success('Note saved');
                setOrderNoteDraft('');
                await refreshOrderOpsExtras(selectedOrder.id);
            } else {
                toast.error('Failed to save note');
            }
        } catch {
            toast.error('Failed to save note');
        } finally {
            setProcessingUpdate(false);
        }
    };

    const submitPartialShip = async (lineId: number) => {
        if (!['admin', 'superadmin'].includes(adminPanelRole)) {
            toast.error('Only administrators can update shipped quantities.');
            return;
        }
        const raw = partialShipInput[lineId] ?? '0';
        const add_qty = parseInt(String(raw), 10);
        if (!Number.isFinite(add_qty) || add_qty <= 0) {
            toast.error('Enter a positive quantity to add to shipped count.');
            return;
        }
        if (!selectedOrder) return;
        try {
            setProcessingUpdate(true);
            const res = await apiClient(`/admin/ops/order-items/${lineId}/shipped`, {
                method: 'PATCH',
                body: JSON.stringify({ add_qty }),
            });
            if ((res as { success?: boolean }).success) {
                toast.success('Shipped quantity updated');
                setPartialShipInput((prev) => ({ ...prev, [lineId]: '' }));
                const detailRes = await apiClient(`/admin/orders/${selectedOrder.id}`);
                if (detailRes.success && detailRes.data) {
                    setSelectedOrder(detailRes.data as Order);
                }
            } else {
                toast.error((res as { message?: string }).message || 'Update failed');
            }
        } catch {
            toast.error('Update failed');
        } finally {
            setProcessingUpdate(false);
        }
    };

    // Order details handlers
    const handleOpenOrderDetails = async (orderId: number) => {
        try {
            setLoading(true);
            const [detailRes, notesRes, shipRes] = await Promise.all([
                apiClient(`/admin/orders/${orderId}`),
                apiClient(`/admin/ops/orders/${orderId}/notes`),
                apiClient(`/admin/ops/orders/${orderId}/shipments`),
            ]);

            if (detailRes.success && detailRes.data) {
                const data = detailRes.data as Order;
                setSelectedOrder(data);
                setOpenOrderDialog(true);
                setOrderNoteDraft('');
                setPartialShipInput({});

                const notesData = (notesRes as { success?: boolean; data?: AdminOrderNoteRow[] }).data;
                const shipData = (shipRes as { success?: boolean; data?: OrderShipmentRow[] }).data;
                setOrderOpsNotes(Array.isArray(notesData) ? notesData : []);
                setOrderShipments(Array.isArray(shipData) ? shipData : []);

                if (data.tracking_number) {
                    setTrackingNumber(data.tracking_number);
                    setTrackingLocked(true);
                } else {
                    setTrackingLocked(false);
                    if (autoGenerateTracking) {
                        setTrackingNumber(generateTrackingCode(orderId));
                    }
                }

                if (data.estimated_delivery_date) {
                    setEstimatedDeliveryDate(data.estimated_delivery_date.split('T')[0]);
                }
            } else {
                setError('Failed to fetch order details');
            }
        } catch (err) {
            setError('Error loading order details');
            console.error('Error fetching order details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseOrderDialog = () => {
        setOpenOrderDialog(false);
        setSelectedOrder(null);
        setUpdateSuccess(false);
        setOrderOpsNotes([]);
        setOrderShipments([]);
        setOrderNoteDraft('');
        setPartialShipInput({});
    };

    // Update order status
    const updateOrderStatus = async (orderId: number, status: string) => {
        try {
            setProcessingUpdate(true);
            
            const response = await apiClient<Partial<Order>>(`/admin/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });

            if (response.success) {
                setSelectedOrder(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        status: status,
                        ...(response.data ?? {})
                    };
                });
                
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.id === orderId ? { ...order, status } : order
                    )
                );
                
                setUpdateSuccess(true);
                
                setTimeout(() => setUpdateSuccess(false), 3000);
            } else {
                setError('Failed to update order status');
            }
        } catch (err) {
            setError('Error updating order status');
            console.error('Error updating order status:', err);
        } finally {
            setProcessingUpdate(false);
        }
    };

    const updatePaymentStatus = async (orderId: number, paymentStatus: string) => {
        try {
            setProcessingUpdate(true);
            
            const response = await apiClient<Partial<Order>>(`/admin/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ payment_status: paymentStatus }),
            });

            if (response.success) {
                setSelectedOrder(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        payment_status: paymentStatus,
                        ...(response.data ?? {})
                    };
                });
                
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.id === orderId ? { ...order, payment_status: paymentStatus } : order
                    )
                );
                
                setUpdateSuccess(true);
                setTimeout(() => setUpdateSuccess(false), 3000);
            } else {
                setError('Failed to update payment status');
            }
        } catch (err) {
            setError('Error updating payment status');
            console.error('Error updating payment status:', err);
        } finally {
            setProcessingUpdate(false);
        }
    };

    const updateShippingInfo = async (orderId: number) => {
        try {
            setProcessingUpdate(true);
            
            const originalOrder = orders.find(order => order.id === orderId);
            const finalTrackingNumber = originalOrder && originalOrder.tracking_number 
                ? originalOrder.tracking_number 
                : trackingNumber;

            const response = await apiClient(`/admin/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    tracking_number: finalTrackingNumber,
                    estimated_delivery_date: estimatedDeliveryDate
                }),
            });

            if (response.success) {
                setSelectedOrder((prev) => prev ? {
                    ...prev,
                    tracking_number: finalTrackingNumber,
                    estimated_delivery_date: estimatedDeliveryDate
                } : null);
                
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.id === orderId ? { 
                            ...order, 
                            tracking_number: finalTrackingNumber,
                            estimated_delivery_date: estimatedDeliveryDate 
                        } : order
                    )
                );
                
                if (finalTrackingNumber && !originalOrder?.tracking_number) {
                    setTrackingLocked(true);
                }
                
                setUpdateSuccess(true);
                setUpdateTrackingMode(false);
                
                setTimeout(() => setUpdateSuccess(false), 3000);
            } else {
                setError('Failed to update shipping information');
            }
        } catch (err) {
            setError('Error updating shipping information');
            console.error('Error updating shipping information:', err);
        } finally {
            setProcessingUpdate(false);
        }
    };

    const regenerateTrackingCode = () => {
        if (selectedOrder && !trackingLocked) {
            setTrackingNumber(generateTrackingCode(selectedOrder.id));
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const calculateOrderTotal = (items: OrderItem[]) => {
        return items.reduce((sum, item) => sum + Number(item.total_price), 0).toFixed(2);
    };

    const printPackingSlip = () => {
        if (!selectedOrder) return;
        const w = window.open('', '_blank', 'width=720,height=900');
        if (!w) {
            toast.error('Allow pop-ups to print the packing slip');
            return;
        }
        const o = selectedOrder;
        const rows = o.items
            .map(
                (item) =>
                    `<tr><td>${escapeHtml(item.product_name)}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">$${Number(
                        item.price
                    ).toFixed(2)}</td></tr>`
            )
            .join('');
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Packing slip ${escapeHtml(
            o.order_number
        )}</title><style>
          body{font-family:system-ui,sans-serif;padding:24px;color:#111;}
          h1{font-size:1.25rem;margin:0 0 4px;}
          .muted{color:#555;font-size:0.9rem;}
          table{width:100%;border-collapse:collapse;margin-top:16px;font-size:0.9rem;}
          th,td{border:1px solid #ddd;padding:8px;text-align:left;}
          th{background:#f4f4f5;}
          .addr{margin-top:16px;line-height:1.5;font-size:0.9rem;}
        </style></head><body>
          <h1>${escapeHtml(SITE_NAME)} — packing slip</h1>
          <p class="muted">Order <strong>${escapeHtml(o.order_number)}</strong> · ${escapeHtml(formatDate(o.createdAt))}</p>
          <div class="addr">
            <strong>Ship to</strong><br/>
            ${escapeHtml(o.user?.name || '')}<br/>
            ${escapeHtml(o.shipping_address || '')}<br/>
            ${escapeHtml(o.shipping_city || '')}, ${escapeHtml(o.shipping_postal_code || '')}<br/>
            ${escapeHtml(o.shipping_country || '')}
          </div>
          <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
          <tbody>${rows}</tbody></table>
          <p style="margin-top:16px;font-weight:600">Total: $${Number(o.total_amount).toFixed(2)}</p>
        </body></html>`;
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden p-6 md:p-8">
                <Container maxWidth="xl">
                    <Box mb={4}>
                        <Typography variant="h4" gutterBottom>
                            Order Management
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            Manage customer orders and update order statuses
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="w-full text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Order volume by status (all orders)
                        </p>
                        {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((key) => {
                            const count = statusCounts[key] ?? 0;
                            const active = statusFilter === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(key);
                                        setPage(0);
                                    }}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                        active
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <span className="capitalize">{key}</span>
                                    <span
                                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                                            active ? 'bg-white text-indigo-700' : 'bg-white text-slate-600'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => {
                                setStatusFilter('all');
                                setPage(0);
                            }}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                statusFilter === 'all'
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                                    : 'border-dashed border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            All statuses
                        </button>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <span className="w-full text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Order date (filters the list below)
                        </span>
                        {(
                            [
                                { id: 'all' as const, label: 'Any time' },
                                { id: 'today' as const, label: 'Today' },
                                { id: '7d' as const, label: 'Last 7 days' },
                                { id: '30d' as const, label: 'Last 30 days' },
                                { id: 'custom' as const, label: 'Custom' },
                            ] as const
                        ).map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                    setDatePreset(opt.id);
                                    setPage(0);
                                }}
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                    datePreset === opt.id
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                        {datePreset === 'custom' && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', width: '100%', mt: 1 }}>
                                <TextField
                                    size="small"
                                    label="From"
                                    type="date"
                                    value={dateCustomFrom}
                                    onChange={(e) => {
                                        setDateCustomFrom(e.target.value);
                                        setPage(0);
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    size="small"
                                    label="To"
                                    type="date"
                                    value={dateCustomTo}
                                    onChange={(e) => {
                                        setDateCustomTo(e.target.value);
                                        setPage(0);
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                        )}
                    </div>

                    <Card sx={{ mb: 4 }}>
                        <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, maxWidth: '600px' }}>
                                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <TextField
                                        size="small"
                                        placeholder="Search — updates as you type"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        fullWidth
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </form>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setPage(0);
                                        }}
                                        label="Status"
                                        startAdornment={
                                            <InputAdornment position="start">
                                                <FilterListIcon fontSize="small" />
                                            </InputAdornment>
                                        }
                                    >
                                        <MenuItem value="all">All</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="processing">Processing</MenuItem>
                                        <MenuItem value="shipped">Shipped</MenuItem>
                                        <MenuItem value="delivered">Delivered</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>

                                <Button variant="outlined" size="small" onClick={exportOrdersCsv} disabled={!orders.length}>
                                    Export CSV
                                </Button>
                                <IconButton onClick={() => void fetchOrders()} color="primary" aria-label="Refresh orders">
                                    <RefreshIcon />
                                </IconButton>
                            </Box>
                        </Box>

                        {loading && orders.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table sx={{ minWidth: 650 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Order #</TableCell>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Customer</TableCell>
                                            <TableCell>Total</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Payment</TableCell>
                                            <TableCell align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {orders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    No orders found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            orders.map((order) => (
                                                <TableRow key={order.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {order.order_number}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{order.user.name}</Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {order.user.email}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>${Number(order.total_amount).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
                                                            size="small"
                                                            sx={{ 
                                                                bgcolor: statusColors[order.status] + '20',
                                                                color: statusColors[order.status],
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)} 
                                                            size="small"
                                                            sx={{ 
                                                                bgcolor: paymentStatusColors[order.payment_status] + '20',
                                                                color: paymentStatusColors[order.payment_status],
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => handleOpenOrderDetails(order.id)}
                                                        >
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        <TablePagination
                            component="div"
                            count={totalItems}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                        />
                    </Card>
                </Container>
            </main>

            <Dialog
                open={openOrderDialog}
                onClose={handleCloseOrderDialog}
                maxWidth="md"
                fullWidth
            >
                {selectedOrder ? (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">
                                    Order #{selectedOrder.order_number}
                                </Typography>
                                <Chip 
                                    label={selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)} 
                                    size="small"
                                    sx={{ 
                                        bgcolor: statusColors[selectedOrder.status] + '20',
                                        color: statusColors[selectedOrder.status],
                                        fontWeight: 600,
                                    }}
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            {updateSuccess && (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Order status updated successfully
                                </Alert>
                            )}

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>Order Information</Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="textSecondary">Order Date</Typography>
                                                <Typography variant="body1">{formatDate(selectedOrder.createdAt)}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                                                <Typography variant="body1" fontWeight={600}>
                                                    ${Number(selectedOrder.total_amount).toFixed(2)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="textSecondary">Payment Method</Typography>
                                                <Typography variant="body1">{selectedOrder.payment_method}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="textSecondary">Payment Status</Typography>
                                                <Chip 
                                                    label={selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)} 
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: paymentStatusColors[selectedOrder.payment_status] + '20',
                                                        color: paymentStatusColors[selectedOrder.payment_status],
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </Grid>
                                            {selectedOrder.respond_by && (
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="body2" color="textSecondary">Respond by (SLA)</Typography>
                                                    <Typography variant="body1">{formatDate(selectedOrder.respond_by)}</Typography>
                                                </Grid>
                                            )}
                                            {selectedOrder.ship_by && (
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="body2" color="textSecondary">Ship by (SLA)</Typography>
                                                    <Typography variant="body1">{formatDate(selectedOrder.ship_by)}</Typography>
                                                </Grid>
                                            )}
                                            {selectedOrder.coupon_code && (
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="body2" color="textSecondary">Coupon</Typography>
                                                    <Typography variant="body1">{selectedOrder.coupon_code}</Typography>
                                                </Grid>
                                            )}
                                            {Number(selectedOrder.discount_amount || 0) > 0 && (
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="body2" color="textSecondary">Discount</Typography>
                                                    <Typography variant="body1">${Number(selectedOrder.discount_amount).toFixed(2)}</Typography>
                                                </Grid>
                                            )}
                                            {selectedOrder.tracking_number && (
                                                <Grid item xs={12}>
                                                    <Typography variant="body2" color="textSecondary">Tracking Number</Typography>
                                                    <Typography variant="body1">{selectedOrder.tracking_number}</Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>Customer Information</Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="body1" fontWeight={500}>{selectedOrder.user.name}</Typography>
                                        <Typography variant="body2">{selectedOrder.contact_email}</Typography>
                                        <Typography variant="body2">{selectedOrder.contact_phone}</Typography>
                                        
                                        <Divider sx={{ my: 1.5 }} />
                                        
                                        <Typography variant="body2" color="textSecondary" gutterBottom>Shipping Address:</Typography>
                                        <Typography variant="body2">
                                            {selectedOrder.shipping_address}
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedOrder.shipping_city}, {selectedOrder.shipping_postal_code}
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedOrder.shipping_country}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>Order Items</Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Product</TableCell>
                                                    <TableCell align="right">Price</TableCell>
                                                    <TableCell align="right">Quantity</TableCell>
                                                    <TableCell align="right">Shipped</TableCell>
                                                    {canEditShippedQty && (
                                                        <TableCell align="right">Add shipped</TableCell>
                                                    )}
                                                    <TableCell align="right">Total</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedOrder.items.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                {item.product?.product_primary_image && (
                                                                    <Box sx={{ width: 40, height: 40, overflow: 'hidden', borderRadius: 1, mr: 2, position: 'relative' }}>
                                                                        <img
                                                                            src={item.product.product_primary_image}
                                                                            alt={item.product_name}
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        />
                                                                    </Box>
                                                                )}
                                                                <Typography variant="body2">
                                                                    {item.product_name}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="right">${Number(item.price).toFixed(2)}</TableCell>
                                                        <TableCell align="right">{item.quantity}</TableCell>
                                                        <TableCell align="right">
                                                            {item.shipped_quantity ?? 0} / {item.quantity}
                                                        </TableCell>
                                                        {canEditShippedQty && (
                                                            <TableCell align="right">
                                                                <Box
                                                                    sx={{
                                                                        display: 'flex',
                                                                        gap: 0.5,
                                                                        justifyContent: 'flex-end',
                                                                        alignItems: 'center',
                                                                        flexWrap: 'wrap',
                                                                    }}
                                                                >
                                                                    <TextField
                                                                        size="small"
                                                                        type="number"
                                                                        value={partialShipInput[item.id] ?? ''}
                                                                        onChange={(e) =>
                                                                            setPartialShipInput((prev) => ({
                                                                                ...prev,
                                                                                [item.id]: e.target.value,
                                                                            }))
                                                                        }
                                                                        inputProps={{ min: 1 }}
                                                                        sx={{ width: 80 }}
                                                                    />
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        onClick={() => void submitPartialShip(item.id)}
                                                                        disabled={processingUpdate}
                                                                    >
                                                                        Add
                                                                    </Button>
                                                                </Box>
                                                            </TableCell>
                                                        )}
                                                        <TableCell align="right">${Number(item.total_price).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={canEditShippedQty ? 5 : 4}
                                                        align="right"
                                                    >
                                                        <strong>Lines subtotal</strong>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography fontWeight={600}>
                                                            ${calculateOrderTotal(selectedOrder.items)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                                {Number(selectedOrder.discount_amount || 0) > 0 && (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={canEditShippedQty ? 5 : 4}
                                                            align="right"
                                                        >
                                                            <strong>
                                                                Discount
                                                                {selectedOrder.coupon_code
                                                                    ? ` (${selectedOrder.coupon_code})`
                                                                    : ''}
                                                            </strong>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography fontWeight={600}>
                                                                -${Number(selectedOrder.discount_amount).toFixed(2)}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={canEditShippedQty ? 5 : 4}
                                                        align="right"
                                                    >
                                                        <strong>Charged total</strong>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography fontWeight={600}>
                                                            ${Number(selectedOrder.total_amount).toFixed(2)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>Internal notes</Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={2}
                                                size="small"
                                                label="New internal note"
                                                value={orderNoteDraft}
                                                onChange={(e) => setOrderNoteDraft(e.target.value)}
                                            />
                                            <Button
                                                variant="contained"
                                                onClick={() => void submitInternalOrderNote()}
                                                disabled={processingUpdate}
                                                sx={{ alignSelf: { sm: 'flex-start' }, flexShrink: 0 }}
                                            >
                                                Save
                                            </Button>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        {orderOpsNotes.length === 0 ? (
                                            <Typography variant="body2" color="textSecondary">
                                                No internal notes yet.
                                            </Typography>
                                        ) : (
                                            orderOpsNotes.map((n) => (
                                                <Box key={n.id} sx={{ mb: 1.5 }}>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {formatDate(n.createdAt)}
                                                    </Typography>
                                                    <Typography variant="body2">{n.body}</Typography>
                                                </Box>
                                            ))
                                        )}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>Shipments</Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        {orderShipments.length === 0 ? (
                                            <Typography variant="body2" color="textSecondary">
                                                No shipment records for this order.
                                            </Typography>
                                        ) : (
                                            orderShipments.map((s) => (
                                                <Box key={s.id} sx={{ mb: 1.5 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {s.tracking_number}
                                                    </Typography>
                                                    {s.carrier && (
                                                        <Typography variant="caption" display="block">
                                                            {s.carrier}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" color="textSecondary">
                                                        {formatDate(s.createdAt)}
                                                    </Typography>
                                                    {s.notes && (
                                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                            {s.notes}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ))
                                        )}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>Update Order Status</Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                                                <Button
                                                    key={status}
                                                    variant={selectedOrder.status === status ? "contained" : "outlined"}
                                                    onClick={() => updateOrderStatus(selectedOrder.id, status)}
                                                    disabled={selectedOrder.status === status || processingUpdate}
                                                    color={status === 'cancelled' ? "error" : "primary"}
                                                    size="small"
                                                    sx={{ textTransform: 'capitalize' }}
                                                >
                                                    {status}
                                                </Button>
                                            ))}
                                            {processingUpdate && (
                                                <CircularProgress size={20} sx={{ ml: 2 }} />
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>Update Payment Status</Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {['pending', 'paid', 'failed', 'refunded'].map((status) => (
                                                <Button
                                                    key={status}
                                                    variant={selectedOrder.payment_status === status ? "contained" : "outlined"}
                                                    onClick={() => updatePaymentStatus(selectedOrder.id, status)}
                                                    disabled={selectedOrder.payment_status === status || processingUpdate}
                                                    color={
                                                        status === 'paid' ? "success" :
                                                        status === 'failed' ? "error" :
                                                        status === 'refunded' ? "warning" : "primary"
                                                    }
                                                    size="small"
                                                    sx={{ textTransform: 'capitalize' }}
                                                >
                                                    {status}
                                                </Button>
                                            ))}
                                            {processingUpdate && (
                                                <CircularProgress size={20} sx={{ ml: 2 }} />
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>Shipping Information</Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        {!updateTrackingMode ? (
                                            <>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="body2" color="textSecondary">Tracking Number</Typography>
                                                        <Typography variant="body1">
                                                            {selectedOrder?.tracking_number || 'Not available'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="body2" color="textSecondary">Estimated Delivery</Typography>
                                                        <Typography variant="body1">
                                                            {selectedOrder?.estimated_delivery_date 
                                                                ? new Date(selectedOrder.estimated_delivery_date).toLocaleDateString() 
                                                                : 'Not available'}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                                <Button 
                                                    variant="outlined" 
                                                    size="small" 
                                                    sx={{ mt: 2 }}
                                                    onClick={() => {
                                                        setTrackingNumber(selectedOrder?.tracking_number || '');
                                                        setEstimatedDeliveryDate(selectedOrder?.estimated_delivery_date?.split('T')[0] || '');
                                                        setUpdateTrackingMode(true);
                                                    }}
                                                >
                                                    Update Shipping Info
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            label="Tracking Number"
                                                            fullWidth
                                                            size="small"
                                                            value={trackingNumber}
                                                            onChange={(e) => !trackingLocked && setTrackingNumber(e.target.value)}
                                                            disabled={trackingLocked}
                                                            helperText={trackingLocked ? "Tracking number is permanent and cannot be changed" : ""}
                                                            InputProps={{
                                                                endAdornment: (
                                                                    <InputAdornment position="end">
                                                                        {trackingLocked ? (
                                                                            <Tooltip title="Tracking codes are permanent once set">
                                                                                <span>
                                                                                    <IconButton size="small" disabled>
                                                                                        <LockIcon fontSize="small" />
                                                                                    </IconButton>
                                                                                </span>
                                                                            </Tooltip>
                                                                        ) : (
                                                                            <Tooltip title="Generate unique tracking code">
                                                                                <IconButton onClick={regenerateTrackingCode} size="small">
                                                                                    <AutorenewIcon />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            label="Estimated Delivery Date"
                                                            type="date"
                                                            fullWidth
                                                            size="small"
                                                            value={estimatedDeliveryDate}
                                                            onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                                                            InputLabelProps={{
                                                                shrink: true,
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                                <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Button 
                                                        variant="contained" 
                                                        size="small"
                                                        onClick={() => updateShippingInfo(selectedOrder!.id)}
                                                        disabled={processingUpdate}
                                                    >
                                                        Save Changes
                                                    </Button>
                                                    <Button 
                                                        variant="outlined" 
                                                        size="small"
                                                        onClick={() => setUpdateTrackingMode(false)}
                                                        disabled={processingUpdate}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    {processingUpdate && (
                                                        <CircularProgress size={20} sx={{ ml: 2 }} />
                                                    )}
                                                </Box>
                                            </>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                startIcon={<PrintIcon />}
                                onClick={printPackingSlip}
                                color="secondary"
                                variant="outlined"
                            >
                                Print packing slip
                            </Button>
                            <Button onClick={handleCloseOrderDialog}>
                                Close
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                )}
            </Dialog>
        </div>
    );
};

export default OrdersManagement;
