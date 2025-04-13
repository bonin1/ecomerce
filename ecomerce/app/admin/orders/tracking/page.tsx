'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import { apiClient } from '@/app/utils/apiClient';
import { generateTrackingCode } from '@/app/utils/trackingCodeGenerator';
import Cookies from 'js-cookie';
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    StepContent,
    Tooltip,
    Switch,
    FormControlLabel,
    Tab,
    Tabs
} from '@mui/material';
import { 
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    FilterList as FilterListIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    LocalShipping as LocalShippingIcon,
    Email as EmailIcon,
    ContentCopy as ContentCopyIcon,
    CheckCircle as CheckCircleIcon,
    Timeline as TimelineIcon,
    Send as SendIcon,
    Add as AddIcon,
    ArrowForward as ArrowForwardIcon,
    LocationOn as LocationOnIcon,
    Autorenew as AutorenewIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import '../orders.scss';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
}

interface TrackingUpdate {
    id?: number;
    order_id: number;
    status: string;
    location: string;
    description: string;
    carrier: string;
    carrier_tracking_number: string;
    estimated_delivery: string | null;
    updated_by: number;
    is_customer_notified: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Order {
    id: number;
    order_number: string;
    user_id: number;
    status: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    tracking_number?: string;
    estimated_delivery_date?: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    items: OrderItem[];
    tracking_history?: TrackingUpdate[];
}

const statusColors: Record<string, string> = {
    order_placed: '#f59e0b', // amber-500
    processing: '#3b82f6', // blue-500
    packed: '#8b5cf6', // violet-500
    shipped: '#10b981', // emerald-500
    out_for_delivery: '#06b6d4', // cyan-500
    delivered: '#10b981', // emerald-500
    failed_delivery: '#ef4444', // red-500
    returned: '#6b7280', // gray-500
    cancelled: '#ef4444', // red-500
};

// Styled Components
const StyledStepConnector = styled(StepConnector)(({ theme }) => ({
    '& .MuiStepConnector-line': {
        minHeight: 40,
        borderLeftWidth: 2,
    },
}));

const TrackingManagementPage = () => {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [openTrackingDialog, setOpenTrackingDialog] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // New tracking update form
    const [newTrackingStatus, setNewTrackingStatus] = useState('processing');
    const [newTrackingLocation, setNewTrackingLocation] = useState('');
    const [newTrackingDescription, setNewTrackingDescription] = useState('');
    const [newCarrier, setNewCarrier] = useState('');
    const [newTrackingNumber, setNewTrackingNumber] = useState('');
    const [newEstimatedDelivery, setNewEstimatedDelivery] = useState('');
    const [notifyCustomer, setNotifyCustomer] = useState(true);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formSuccess, setFormSuccess] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [trackingTabValue, setTrackingTabValue] = useState(0);
    const [autoGenerateTracking, setAutoGenerateTracking] = useState(true);
    const [trackingLocked, setTrackingLocked] = useState(false);

    // Validation
    const [errors, setErrors] = useState({
        status: false,
        location: false,
        carrier: false
    });

    // Tracking history states
    const [trackingHistory, setTrackingHistory] = useState<TrackingUpdate[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Auth check and data fetch
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
        
        // Fetch both pending and recent orders
        fetchPendingOrders();
        fetchOrders();
    }, [router]);

    const fetchPendingOrders = async () => {
        try {
            setLoading(true);
            const response = await apiClient('/admin/orders?status=processing&limit=10');
            
            if (response.success) {
                setPendingOrders(response.data.orders);
            }
        } catch (error) {
            console.error('Error fetching pending orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            
            const queryParams = new URLSearchParams({
                page: String(page + 1),
                limit: String(rowsPerPage),
                sortBy: 'updatedAt',
                order: 'DESC',
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
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle search and pagination
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchOrders();
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Order and tracking management
    const handleOpenTrackingDialog = async (order: Order) => {
        setSelectedOrder(order);
        setOpenTrackingDialog(true);
        
        // Reset form fields to use the order's current values
        if (order.tracking_number) {
            setNewTrackingNumber(order.tracking_number);
            setAutoGenerateTracking(false);
            setTrackingLocked(true);
        } else {
            setTrackingLocked(false);
            if (autoGenerateTracking) {
                // Auto-generate unique tracking number if none exists
                setNewTrackingNumber(generateTrackingCode(order.id));
            }
        }
        
        if (order.estimated_delivery_date) {
            setNewEstimatedDelivery(order.estimated_delivery_date.split('T')[0]);
        }

        // Fetch tracking history for this order
        fetchOrderTrackingHistory(order.id);
    };

    const handleCloseTrackingDialog = () => {
        setOpenTrackingDialog(false);
        setSelectedOrder(null);
        setFormSuccess(false);
        setFormError(null);
        resetTrackingForm();
    };

    const fetchOrderTrackingHistory = async (orderId: number) => {
        try {
            setLoadingHistory(true);
            const response = await apiClient(`/admin/orders/${orderId}/tracking`);
            
            if (response.success) {
                setTrackingHistory(response.data || []);
            } else {
                setTrackingHistory([]);
            }
        } catch (error) {
            console.error('Error fetching tracking history:', error);
            setTrackingHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const validateForm = () => {
        const newErrors = {
            status: !newTrackingStatus,
            location: !newTrackingLocation,
            carrier: false
        };
        
        // If shipping/delivery status but no carrier, mark as error
        if (['shipped', 'out_for_delivery', 'delivered'].includes(newTrackingStatus) && !newCarrier) {
            newErrors.carrier = true;
        }
        
        setErrors(newErrors);
        
        return !Object.values(newErrors).some(error => error);
    };

    const handleAddTrackingUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedOrder) return;
        if (!validateForm()) return;

        try {
            setFormSubmitting(true);
            setFormError(null);

            const isShippingUpdate = ['shipped', 'out_for_delivery', 'delivered'].includes(newTrackingStatus);
            const needsToLockTracking = isShippingUpdate && !trackingLocked && newTrackingNumber;

            const trackingData = {
                status: newTrackingStatus,
                location: newTrackingLocation,
                description: newTrackingDescription,
                carrier: newCarrier,
                carrierTrackingNumber: newTrackingNumber,
                estimatedDelivery: newEstimatedDelivery || null,
                notifyCustomer,
                lockTracking: needsToLockTracking
            };

            const response = await apiClient(`/admin/orders/${selectedOrder.id}/tracking`, {
                method: 'POST',
                body: JSON.stringify(trackingData)
            });

            if (response.success) {
                if (needsToLockTracking) {
                    setTrackingLocked(true);
                }
                
                setFormSuccess(true);
                
                // Update the tracking history
                fetchOrderTrackingHistory(selectedOrder.id);
                
                // Refresh pending orders list
                fetchPendingOrders();
                
                // Refresh all orders
                fetchOrders();
                
                // Clear form
                resetTrackingForm();
                
                // Automatically switch to history tab after successful update
                setTrackingTabValue(1);
                
                // Clear success message after 5 seconds
                setTimeout(() => {
                    setFormSuccess(false);
                }, 5000);
            } else {
                setFormError(response.message || 'Failed to add tracking update');
            }
        } catch (error: any) {
            setFormError(error.message || 'An error occurred while updating tracking information');
            console.error('Error adding tracking update:', error);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleResendNotification = async (trackingUpdateId: number) => {
        try {
            setLoadingHistory(true);
            
            const response = await apiClient(`/admin/tracking/${trackingUpdateId}/notify`, {
                method: 'POST'
            });

            if (response.success) {
                // Update the tracking history to reflect the notification was sent
                fetchOrderTrackingHistory(selectedOrder!.id);
            } else {
                alert('Failed to resend notification');
            }
        } catch (error) {
            console.error('Error resending notification:', error);
            alert('Error resending notification');
        } finally {
            setLoadingHistory(false);
        }
    };

    const resetTrackingForm = () => {
        setNewTrackingStatus('processing');
        setNewTrackingLocation('');
        setNewTrackingDescription('');
        setNewCarrier('');
        setNewTrackingNumber('');
        setNewEstimatedDelivery('');
        setNotifyCustomer(true);
        setErrors({
            status: false,
            location: false,
            carrier: false
        });
    };

    const getFormattedDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getSuggestedMessage = (status: string) => {
        switch (status) {
            case 'processing':
                return 'Your order is now being processed at our facility.';
            case 'packed':
                return 'Your order has been packed and is ready for shipping.';
            case 'shipped':
                return 'Your order has been shipped and is on its way to you.';
            case 'out_for_delivery':
                return 'Your order is out for delivery and will arrive today.';
            case 'delivered':
                return 'Your order has been delivered successfully.';
            case 'failed_delivery':
                return 'Delivery attempt was unsuccessful. We will try again soon.';
            default:
                return '';
        }
    };

    const handleTrackingTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTrackingTabValue(newValue);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const regenerateTrackingCode = () => {
        if (selectedOrder && !trackingLocked) {
            setNewTrackingNumber(generateTrackingCode(selectedOrder.id));
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main" style={{ marginLeft: '250px', padding: '2rem' }}>
                <Container maxWidth="xl">
                    <Box mb={3}>
                        <Typography variant="h4" gutterBottom>
                            Order Tracking Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage order tracking information and update shipping status
                        </Typography>
                    </Box>

                    <Box mb={4}>
                        <Typography variant="h5" gutterBottom fontWeight={500}>
                            Orders Awaiting Fulfillment
                        </Typography>
                        
                        <Grid container spacing={2}>
                            {loading && pendingOrders.length === 0 ? (
                                <Grid item xs={12}>
                                    <Box display="flex" justifyContent="center" p={3}>
                                        <CircularProgress />
                                    </Box>
                                </Grid>
                            ) : pendingOrders.length === 0 ? (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                                        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                                        <Typography variant="h6">
                                            No orders awaiting fulfillment!
                                        </Typography>
                                        <Typography color="text.secondary">
                                            All orders have been processed
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ) : (
                                pendingOrders.map((order) => (
                                    <Grid item xs={12} md={6} lg={4} key={order.id}>
                                        <Card sx={{ 
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                            '&:hover': {
                                                boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)',
                                            }
                                        }}>
                                            <Box sx={{ 
                                                position: 'absolute', 
                                                top: 12, 
                                                right: 12,
                                                zIndex: 1,
                                            }}>
                                                <Chip 
                                                    label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: statusColors[order.status] + '20',
                                                        color: statusColors[order.status],
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </Box>
                                            
                                            <Box sx={{ p: 2, flexGrow: 1 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    Order #{order.order_number}
                                                </Typography>
                                                
                                                <Box sx={{ mt: 1, mb: 2 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Customer:</strong> {order.user.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Items:</strong> {order.items.length}
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                                                        ${Number(order.total_amount).toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            
                                            <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                                                <Button 
                                                    variant="contained" 
                                                    startIcon={<LocalShippingIcon />}
                                                    onClick={() => handleOpenTrackingDialog(order)}
                                                    fullWidth
                                                >
                                                    Update Tracking
                                                </Button>
                                            </Box>
                                        </Card>
                                    </Grid>
                                ))
                            )}
                        </Grid>
                    </Box>

                    <Box mb={3}>
                        <Typography variant="h5" gutterBottom fontWeight={500}>
                            All Orders
                        </Typography>
                    </Box>

                    <Card sx={{ mb: 4 }}>
                        <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
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

                        <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Order #</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Customer</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Tracking</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading && orders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : orders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
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
                                                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{order.user.name}</Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {order.user.email}
                                                    </Typography>
                                                </TableCell>
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
                                                    {order.tracking_number ? (
                                                        <Tooltip title={`${order.tracking_number}`}>
                                                            <Chip 
                                                                icon={<LocalShippingIcon />}
                                                                label="Tracking set" 
                                                                size="small" 
                                                                color="info"
                                                                variant="outlined"
                                                            />
                                                        </Tooltip>
                                                    ) : (
                                                        <Chip 
                                                            label="No tracking" 
                                                            size="small" 
                                                            variant="outlined"
                                                            color="default"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleOpenTrackingDialog(order)}
                                                    >
                                                        <LocalShippingIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

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
                open={openTrackingDialog} 
                onClose={handleCloseTrackingDialog}
                maxWidth="md"
                fullWidth
            >
                {selectedOrder && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="h6">
                                        Update Tracking: Order #{selectedOrder.order_number}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Customer: {selectedOrder.user.name} ({selectedOrder.user.email})
                                    </Typography>
                                </Box>
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
                            <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                <Tabs 
                                    value={trackingTabValue} 
                                    onChange={handleTrackingTabChange} 
                                    variant="fullWidth"
                                    aria-label="tracking tabs"
                                >
                                    <Tab 
                                        icon={<AddIcon />} 
                                        iconPosition="start" 
                                        label="Add Tracking Update" 
                                    />
                                    <Tab 
                                        icon={<TimelineIcon />} 
                                        iconPosition="start" 
                                        label="Tracking History" 
                                    />
                                </Tabs>
                            </Box>

                            {trackingTabValue === 0 && (
                                <Box sx={{ py: 2 }}>
                                    {formSuccess && (
                                        <Alert severity="success" sx={{ mb: 3 }}>
                                            Tracking information updated successfully.
                                        </Alert>
                                    )}
                                    
                                    {formError && (
                                        <Alert severity="error" sx={{ mb: 3 }}>
                                            {formError}
                                        </Alert>
                                    )}
                                    
                                    <form onSubmit={handleAddTrackingUpdate}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth error={errors.status} required>
                                                    <InputLabel>Status</InputLabel>
                                                    <Select
                                                        value={newTrackingStatus}
                                                        label="Status"
                                                        onChange={(e) => {
                                                            setNewTrackingStatus(e.target.value);
                                                            setNewTrackingDescription(getSuggestedMessage(e.target.value));
                                                        }}
                                                    >
                                                        <MenuItem value="order_placed">Order Placed</MenuItem>
                                                        <MenuItem value="processing">Processing</MenuItem>
                                                        <MenuItem value="packed">Packed</MenuItem>
                                                        <MenuItem value="shipped">Shipped</MenuItem>
                                                        <MenuItem value="out_for_delivery">Out for Delivery</MenuItem>
                                                        <MenuItem value="delivered">Delivered</MenuItem>
                                                        <MenuItem value="failed_delivery">Failed Delivery</MenuItem>
                                                        <MenuItem value="returned">Returned</MenuItem>
                                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    label="Location"
                                                    fullWidth
                                                    required
                                                    value={newTrackingLocation}
                                                    onChange={(e) => setNewTrackingLocation(e.target.value)}
                                                    error={errors.location}
                                                    helperText={errors.location ? "Location is required" : ""}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <LocationOnIcon />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Grid>
                                            
                                            <Grid item xs={12}>
                                                <TextField
                                                    label="Description"
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={newTrackingDescription}
                                                    onChange={(e) => setNewTrackingDescription(e.target.value)}
                                                    placeholder="Additional details about this tracking update"
                                                />
                                            </Grid>
                                            
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    label="Carrier"
                                                    fullWidth
                                                    value={newCarrier}
                                                    onChange={(e) => setNewCarrier(e.target.value)}
                                                    error={errors.carrier}
                                                    helperText={errors.carrier ? "Required for shipped status" : ""}
                                                />
                                            </Grid>
                                            
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    label="Tracking Number"
                                                    fullWidth
                                                    value={newTrackingNumber}
                                                    onChange={(e) => !trackingLocked && setNewTrackingNumber(e.target.value)}
                                                    placeholder="Carrier tracking number"
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
                                                    value={newEstimatedDelivery}
                                                    onChange={(e) => setNewEstimatedDelivery(e.target.value)}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                />
                                            </Grid>
                                            
                                            <Grid item xs={12} sm={6}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch 
                                                            checked={notifyCustomer} 
                                                            onChange={(e) => setNotifyCustomer(e.target.checked)}
                                                            color="primary"
                                                        />
                                                    }
                                                    label="Notify customer via email"
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Switch 
                                                            checked={autoGenerateTracking} 
                                                            onChange={(e) => {
                                                                if (!trackingLocked) {
                                                                    setAutoGenerateTracking(e.target.checked);
                                                                    if (e.target.checked && selectedOrder) {
                                                                        setNewTrackingNumber(generateTrackingCode(selectedOrder.id));
                                                                    }
                                                                }
                                                            }}
                                                            color="primary"
                                                            disabled={trackingLocked}
                                                        />
                                                    }
                                                    label="Auto-generate tracking code"
                                                />
                                            </Grid>
                                            
                                            <Grid item xs={12}>
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    color="primary"
                                                    size="large"
                                                    disabled={formSubmitting}
                                                    startIcon={formSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                                                    sx={{ mt: 2 }}
                                                    fullWidth
                                                >
                                                    {formSubmitting ? 'Submitting...' : 'Add Tracking Update'}
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </form>
                                </Box>
                            )}

                            {trackingTabValue === 1 && (
                                <Box sx={{ py: 2 }}>
                                    {loadingHistory ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : trackingHistory.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                No tracking updates available for this order.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <Stepper orientation="vertical" connector={<StyledStepConnector />}>
                                                {trackingHistory.map((update, index) => (
                                                    <Step key={index} expanded>
                                                        <StepLabel
                                                            StepIconProps={{
                                                                sx: { 
                                                                    color: statusColors[update.status],
                                                                    '&.Mui-completed': { color: statusColors[update.status] }
                                                                }
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                                <Typography variant="subtitle2">
                                                                    {update.status.split('_').map(word => 
                                                                        word.charAt(0).toUpperCase() + word.slice(1)
                                                                    ).join(' ')}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {getFormattedDate(update.createdAt)}
                                                                </Typography>
                                                            </Box>
                                                        </StepLabel>
                                                        <StepContent>
                                                            <Box sx={{ mb: 2 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                    <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                                                    <Typography variant="body2">
                                                                        {update.location}
                                                                    </Typography>
                                                                </Box>
                                                                
                                                                {update.description && (
                                                                    <Typography variant="body2" sx={{ my: 1, color: 'text.secondary' }}>
                                                                        {update.description}
                                                                    </Typography>
                                                                )}
                                                                
                                                                {(update.carrier || update.carrier_tracking_number) && (
                                                                    <Box sx={{ 
                                                                        mt: 1, 
                                                                        p: 1.5,
                                                                        bgcolor: 'background.paper', 
                                                                        borderRadius: 1,
                                                                        border: '1px solid',
                                                                        borderColor: 'divider'
                                                                    }}>
                                                                        {update.carrier && (
                                                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                                <strong>Carrier:</strong> {update.carrier}
                                                                            </Typography>
                                                                        )}
                                                                        
                                                                        {update.carrier_tracking_number && (
                                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                <Typography variant="body2" component="div">
                                                                                    <strong>Tracking #:</strong> {update.carrier_tracking_number}
                                                                                </Typography>
                                                                                <IconButton 
                                                                                    size="small"
                                                                                    onClick={() => copyToClipboard(update.carrier_tracking_number)}
                                                                                    sx={{ ml: 1 }}
                                                                                >
                                                                                    <ContentCopyIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Box>
                                                                        )}
                                                                        
                                                                        {update.estimated_delivery && (
                                                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                                                <strong>Est. Delivery:</strong> {new Date(update.estimated_delivery).toLocaleDateString()}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                )}
                                                                
                                                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                    <Chip
                                                                        icon={update.is_customer_notified ? <EmailIcon /> : undefined}
                                                                        label={update.is_customer_notified ? "Customer notified" : "Not notified"}
                                                                        variant="outlined"
                                                                        size="small"
                                                                        color={update.is_customer_notified ? "success" : "default"}
                                                                    />
                                                                    
                                                                    {!update.is_customer_notified && (
                                                                        <Button
                                                                            size="small"
                                                                            startIcon={<EmailIcon />}
                                                                            onClick={() => handleResendNotification(update.id!)}
                                                                            variant="outlined"
                                                                        >
                                                                            Send Notification
                                                                        </Button>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </StepContent>
                                                    </Step>
                                                ))}
                                            </Stepper>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseTrackingDialog}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </div>
    );
};

export default TrackingManagementPage;