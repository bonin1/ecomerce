'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import { apiClient } from '@/app/utils/apiClient';
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
} from '@mui/material';
import { 
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    FilterList as FilterListIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';

interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    total_price: number;
    product: {
        id: number;
        product_name: string;
        product_primary_image: string;
        product_price: number;
    };
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

    // Auth check
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin/login');
        }
    }, [router]);

    // Fetch orders
    const fetchOrders = async () => {
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

            if (searchTerm) {
                queryParams.append('search', searchTerm);
            }

            const response = await apiClient(`/admin/orders?${queryParams.toString()}`);
            
            if (response.success) {
                setOrders(response.data.orders);
                setTotalItems(response.data.totalItems);
            } else {
                setError('Failed to fetch orders');
            }
        } catch (err) {
            setError('Error loading orders. Please try again.');
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, rowsPerPage, statusFilter, sortBy, sortOrder]);

    // Handle search submit
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchOrders();
    };

    // Pagination handlers
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Order details handlers
    const handleOpenOrderDetails = async (orderId: number) => {
        try {
            setLoading(true);
            const response = await apiClient(`/admin/orders/${orderId}`);
            
            if (response.success) {
                setSelectedOrder(response.data);
                setOpenOrderDialog(true);
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
    };

    // Update order status
    const updateOrderStatus = async (orderId: number, status: string) => {
        try {
            setProcessingUpdate(true);
            
            const response = await apiClient(`/admin/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });

            if (response.success) {
                // Update the selected order - preserve the full order structure
                // especially the user object
                setSelectedOrder(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        status: status,
                        ...response.data
                    };
                });
                
                // Update the order in the list
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.id === orderId ? { ...order, status } : order
                    )
                );
                
                setUpdateSuccess(true);
                
                // Clear the success message after 3 seconds
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

    // Add a new function to update payment status
    const updatePaymentStatus = async (orderId: number, paymentStatus: string) => {
        try {
            setProcessingUpdate(true);
            
            const response = await apiClient(`/admin/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ payment_status: paymentStatus }),
            });

            if (response.success) {
                // Update the selected order - preserve the full object structure
                setSelectedOrder(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        payment_status: paymentStatus,
                        ...response.data
                    };
                });
                
                // Update the order in the list
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

    // Update shipping information
    const updateShippingInfo = async (orderId: number) => {
        try {
            setProcessingUpdate(true);
            
            const response = await apiClient(`/admin/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    tracking_number: trackingNumber,
                    estimated_delivery_date: estimatedDeliveryDate
                }),
            });

            if (response.success) {
                // Update the selected order
                setSelectedOrder((prev) => prev ? {
                    ...prev,
                    tracking_number: trackingNumber,
                    estimated_delivery_date: estimatedDeliveryDate
                } : null);
                
                setUpdateSuccess(true);
                setUpdateTrackingMode(false);
                
                // Clear the success message after 3 seconds
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

    // Function to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    // Calculate order total
    const calculateOrderTotal = (items: OrderItem[]) => {
        return items.reduce((sum, item) => sum + Number(item.total_price), 0).toFixed(2);
    };

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main" style={{ marginLeft: '250px', padding: '2rem' }}>
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

                    <Card sx={{ mb: 4 }}>
                        <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Search Form */}
                            <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, maxWidth: '600px' }}>
                                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <TextField
                                        size="small"
                                        placeholder="Search by order #, customer name, or email"
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
                                    <Button type="submit" variant="contained">
                                        Search
                                    </Button>
                                </form>
                            </Box>

                            {/* Filters */}
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

                                <IconButton onClick={() => fetchOrders()} color="primary">
                                    <RefreshIcon />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Orders Table */}
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

            {/* Order Details Dialog */}
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
                                                        <TableCell align="right">${Number(item.total_price).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell colSpan={2} />
                                                    <TableCell align="right"><strong>Total:</strong></TableCell>
                                                    <TableCell align="right">
                                                        <Typography fontWeight={600}>
                                                            ${calculateOrderTotal(selectedOrder.items)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
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

                                {/* Add Payment Status Update Section */}
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
                                                            onChange={(e) => setTrackingNumber(e.target.value)}
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
                                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
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
