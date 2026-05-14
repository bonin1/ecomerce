'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
    Chip,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Tooltip,
    Checkbox,
    Alert,
    CircularProgress,
    Grid,
    SelectChangeEvent
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Block as SuspendIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiClient } from '../../../utils/apiClient';
import { Affiliate, AffiliatesResponse } from '../../../types';
import AffiliateForm from './AffiliateForm';

const AffiliateList: React.FC = () => {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkActionEnabled, setBulkActionEnabled] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkStatus, setBulkStatus] = useState<'pending' | 'approved' | 'rejected' | 'suspended'>('approved');

    const fetchAffiliates = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('page', (page + 1).toString());
            params.append('limit', rowsPerPage.toString());
            
            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }
            
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            const response = (await apiClient(`/affiliate/admin/all?${params.toString()}`)) as AffiliatesResponse;
            
            if (response.success) {
                setAffiliates(response.data.affiliates);
                setTotalCount(response.data.totalCount);
            } else {
                setError('Failed to fetch affiliates');
            }
        } catch (err) {
            console.error('Error fetching affiliates:', err);
            setError('Failed to load affiliates. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAffiliates();
    }, [page, rowsPerPage, selectedStatus]);

    const handleSearch = () => {
        setPage(0);
        fetchAffiliates();
    };

    const handleStatusChange = (event: SelectChangeEvent) => {
        setSelectedStatus(event.target.value);
        setPage(0);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleEdit = (affiliate: Affiliate) => {
        setSelectedAffiliate(affiliate);
        setShowForm(true);
    };

    const handleView = (affiliate: Affiliate) => {
        setSelectedAffiliate(affiliate);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setSelectedAffiliate(null);
    };

    const handleFormSubmitSuccess = () => {
        setShowForm(false);
        setSelectedAffiliate(null);
        fetchAffiliates();
        toast.success('Affiliate updated successfully!');
    };

    const confirmDelete = (affiliate: Affiliate) => {
        setSelectedAffiliate(affiliate);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedAffiliate) return;

        try {
            const response = await apiClient(`/affiliate/admin/${selectedAffiliate.id}`, {
                method: 'DELETE'
            });

            if (response.success) {
                toast.success('Affiliate deleted successfully!');
                setDeleteDialogOpen(false);
                setSelectedAffiliate(null);
                fetchAffiliates();
            } else {
                toast.error(response.message || 'Failed to delete affiliate');
            }
        } catch (error) {
            console.error('Error deleting affiliate:', error);
            toast.error('Failed to delete affiliate. Please try again.');
        }
    };

    const handleBulkSelection = (affiliateId: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, affiliateId]);
        } else {
            setSelectedIds(prev => prev.filter(id => id !== affiliateId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(affiliates.map(affiliate => affiliate.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkStatusChange = async () => {
        if (selectedIds.length === 0) {
            toast.error('Please select affiliates to update');
            return;
        }

        try {
            const response = await apiClient('/affiliate/admin/bulk/status', {
                method: 'PUT',
                body: JSON.stringify({
                    affiliateIds: selectedIds,
                    status: bulkStatus
                })
            });

            if (response.success) {
                toast.success(response.message);
                setSelectedIds([]);
                setBulkActionEnabled(false);
                fetchAffiliates();
            } else {
                toast.error(response.message || 'Failed to update affiliates');
            }
        } catch (error) {
            console.error('Error updating affiliates:', error);
            toast.error('Failed to update affiliates. Please try again.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'suspended':
                return 'default';
            default:
                return 'default';
        }
    };

    const quickStatusUpdate = async (affiliate: Affiliate, newStatus: string) => {
        try {
            const response = await apiClient(`/affiliate/admin/${affiliate.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            if (response.success) {
                toast.success(`Affiliate ${newStatus} successfully!`);
                fetchAffiliates();
            } else {
                toast.error(response.message || 'Failed to update affiliate status');
            }
        } catch (error) {
            console.error('Error updating affiliate status:', error);
            toast.error('Failed to update affiliate status. Please try again.');
        }
    };

    if (showForm) {
        return (
            <AffiliateForm
                affiliate={selectedAffiliate}
                onClose={handleFormClose}
                onSubmitSuccess={handleFormSubmitSuccess}
                isViewMode={false}
            />
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
                Affiliate Management
            </Typography>

            {/* Search and Filter Controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Search affiliates"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            InputProps={{
                                endAdornment: (
                                    <IconButton onClick={handleSearch}>
                                        <SearchIcon />
                                    </IconButton>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={selectedStatus}
                                label="Status"
                                onChange={handleStatusChange}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                                <MenuItem value="suspended">Suspended</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                                variant={bulkActionEnabled ? "contained" : "outlined"}
                                onClick={() => setBulkActionEnabled(!bulkActionEnabled)}
                                size="small"
                            >
                                Bulk Actions
                            </Button>
                            {bulkActionEnabled && (
                                <>
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <Select
                                            value={bulkStatus}
                                            onChange={(e) => setBulkStatus(e.target.value as any)}
                                        >
                                            <MenuItem value="approved">Approve</MenuItem>
                                            <MenuItem value="rejected">Reject</MenuItem>
                                            <MenuItem value="suspended">Suspend</MenuItem>
                                            <MenuItem value="pending">Mark Pending</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleBulkStatusChange}
                                        disabled={selectedIds.length === 0}
                                    >
                                        Apply ({selectedIds.length})
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ width: '100%' }}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                {bulkActionEnabled && (
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedIds.length > 0 && selectedIds.length < affiliates.length}
                                            checked={affiliates.length > 0 && selectedIds.length === affiliates.length}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </TableCell>
                                )}
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Affiliate Code</TableCell>
                                <TableCell>Commission Rate</TableCell>
                                <TableCell>Total Earnings</TableCell>
                                <TableCell>Clicks/Conversions</TableCell>
                                <TableCell>Applied Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={bulkActionEnabled ? 10 : 9} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : affiliates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={bulkActionEnabled ? 10 : 9} align="center">
                                        No affiliates found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                affiliates.map((affiliate) => (
                                    <TableRow key={affiliate.id} hover>
                                        {bulkActionEnabled && (
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedIds.includes(affiliate.id)}
                                                    onChange={(e) => handleBulkSelection(affiliate.id, e.target.checked)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>{affiliate.fullName}</TableCell>
                                        <TableCell>{affiliate.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                                                color={getStatusColor(affiliate.status) as any}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {affiliate.affiliateCode ? (
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {affiliate.affiliateCode}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Not assigned
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>{affiliate.commissionRate}%</TableCell>
                                        <TableCell>${(affiliate.totalEarnings || 0).toFixed(2)}</TableCell>
                                        <TableCell>
                                            {affiliate.totalClicks || 0} / {affiliate.totalConversions || 0}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(affiliate.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={() => handleView(affiliate)}>
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => handleEdit(affiliate)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {affiliate.status === 'pending' && (
                                                    <>
                                                        <Tooltip title="Approve">
                                                            <IconButton 
                                                                size="small" 
                                                                color="success"
                                                                onClick={() => quickStatusUpdate(affiliate, 'approved')}
                                                            >
                                                                <ApproveIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Reject">
                                                            <IconButton 
                                                                size="small" 
                                                                color="error"
                                                                onClick={() => quickStatusUpdate(affiliate, 'rejected')}
                                                            >
                                                                <RejectIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                {affiliate.status === 'approved' && (
                                                    <Tooltip title="Suspend">
                                                        <IconButton 
                                                            size="small" 
                                                            color="warning"
                                                            onClick={() => quickStatusUpdate(affiliate, 'suspended')}
                                                        >
                                                            <SuspendIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Delete">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => confirmDelete(affiliate)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the affiliate "{selectedAffiliate?.fullName}"? 
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AffiliateList;
