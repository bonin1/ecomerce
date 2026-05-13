'use client';
import React, { useState, useEffect } from 'react';
import { Career } from '@/app/types';
import { apiClient } from '@/app/utils/apiClient';
import {
    Button,
    Box,
    Typography,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    MenuItem,
    Pagination,
    FormControlLabel,
    Switch,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import CareerForm from './CareerForms';

const CareerList: React.FC = () => {
    const [careers, setCareers] = useState<Career[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [locations, setLocations] = useState<string[]>([]);
    const [bulkActionEnabled, setBulkActionEnabled] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkStatus, setBulkStatus] = useState<'active' | 'inactive'>('active');

    const fetchCareers = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '10');
            
            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }
            
            if (searchQuery) {
                params.append('search', searchQuery);
            }
            
            if (selectedLocation) {
                params.append('location', selectedLocation);
            }
            
            const response = await apiClient(`/careers/listings?${params.toString()}`);
            
            if (response.success) {
                setCareers(response.data);
                setTotalPages(response.totalPages || 1);
                
                const uniqueLocations = Array.from(
                    new Set(response.data.map((career: Career) => career.location as string))
                ) as string[];
                setLocations(uniqueLocations);
            } else {
                setError('Failed to load career listings');
            }
        } catch (err) {
            console.error('Error fetching careers:', err);
            setError('Failed to load career listings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCareers();
    }, [page, selectedStatus, selectedLocation]);

    const handleSearch = () => {
        setPage(1);
        fetchCareers();
    };

    const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedStatus(event.target.value);
        setPage(1); 
    };

    const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedLocation(event.target.value);
        setPage(1);
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const handleEdit = (career: Career) => {
        setSelectedCareer(career);
        setShowForm(true);
    };

    const handleCreate = () => {
        setSelectedCareer(null);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setSelectedCareer(null);
    };

    const handleFormSubmitSuccess = () => {
        setShowForm(false);
        setSelectedCareer(null);
        fetchCareers();
    };

    const confirmDelete = (career: Career) => {
        setSelectedCareer(career);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCareer) return;
        
        try {
            const response = await apiClient(`/careers/delete/${selectedCareer.id}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                setCareers(prev => prev.filter(c => c.id !== selectedCareer.id));
                setDeleteDialogOpen(false);
                setSelectedCareer(null);
            } else {
                setError('Failed to delete career listing');
            }
        } catch (err) {
            console.error('Error deleting career:', err);
            setError('Failed to delete career listing. Please try again.');
        }
    };

    const handleBulkSelection = (careerId: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, careerId]);
        } else {
            setSelectedIds(prev => prev.filter(id => id !== careerId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(careers.map(career => career.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkStatusChange = async () => {
        if (selectedIds.length === 0) return;
        
        try {
            const response = await apiClient('/careers/bulk-update-status', {
                method: 'PUT',
                body: JSON.stringify({
                    careerIds: selectedIds,
                    status: bulkStatus
                })
            });
            
            if (response.success) {
                fetchCareers();
                setSelectedIds([]);
                setBulkActionEnabled(false);
            } else {
                setError('Failed to update career statuses');
            }
        } catch (err) {
            console.error('Error updating career statuses:', err);
            setError('Failed to update career statuses. Please try again.');
        }
    };

    if (showForm) {
        return (
            <CareerForm
                initialData={selectedCareer || undefined}
                onSubmitSuccess={handleFormSubmitSuccess}
                onCancel={handleFormClose}
            />
        );
    }

    return (
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={3}
                flexWrap="wrap"
                gap={2}
            >
                <Typography variant="h5">Job Listings</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Add New Job
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                    <TextField
                        label="Search"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        sx={{ minWidth: 200 }}
                    />
                    
                    <TextField
                        select
                        label="Status"
                        value={selectedStatus}
                        onChange={handleStatusChange}
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                    </TextField>
                    
                    <TextField
                        select
                        label="Location"
                        value={selectedLocation}
                        onChange={handleLocationChange}
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="">All Locations</MenuItem>
                        {locations.map((location, index) => (
                            <MenuItem key={index} value={location}>
                                {location}
                            </MenuItem>
                        ))}
                    </TextField>
                    
                    <Button 
                        variant="outlined" 
                        onClick={handleSearch}
                    >
                        Search
                    </Button>
                </Box>
                
                {bulkActionEnabled && selectedIds.length > 0 && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography>
                                {selectedIds.length} item(s) selected
                            </Typography>
                            
                            <TextField
                                select
                                label="Set Status"
                                value={bulkStatus}
                                onChange={(e) => setBulkStatus(e.target.value as 'active' | 'inactive')}
                                size="small"
                                sx={{ minWidth: 150 }}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </TextField>
                            
                            <Button 
                                variant="contained" 
                                onClick={handleBulkStatusChange}
                                color="primary"
                                size="small"
                            >
                                Apply
                            </Button>
                            
                            <Button 
                                variant="outlined"
                                onClick={() => setSelectedIds([])}
                                size="small"
                            >
                                Clear Selection
                            </Button>
                        </Box>
                    </Box>
                )}
                
                <FormControlLabel
                    control={
                        <Switch 
                            checked={bulkActionEnabled}
                            onChange={(e) => {
                                setBulkActionEnabled(e.target.checked);
                                if (!e.target.checked) {
                                    setSelectedIds([]);
                                }
                            }}
                        />
                    }
                    label="Enable Bulk Actions"
                />
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {bulkActionEnabled && (
                                <TableCell padding="checkbox">
                                    <FormControlLabel
                                        control={
                                            <Switch 
                                                checked={selectedIds.length === careers.length && careers.length > 0}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                size="small"
                                            />
                                        }
                                        label=""
                                    />
                                </TableCell>
                            )}
                            <TableCell>Title</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={bulkActionEnabled ? 6 : 5} align="center" sx={{ py: 3 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : careers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={bulkActionEnabled ? 6 : 5} align="center" sx={{ py: 3 }}>
                                    No job listings found
                                </TableCell>
                            </TableRow>
                        ) : (
                            careers.map((career) => (
                                <TableRow key={career.id}>
                                    {bulkActionEnabled && (
                                        <TableCell padding="checkbox">
                                            <FormControlLabel
                                                control={
                                                    <Switch 
                                                        checked={selectedIds.includes(career.id)}
                                                        onChange={(e) => handleBulkSelection(career.id, e.target.checked)}
                                                        size="small"
                                                    />
                                                }
                                                label=""
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Typography fontWeight="medium">
                                            {career.title}
                                        </Typography>
                                        {career.salary && (
                                            <Typography variant="body2" color="text.secondary">
                                                {career.salary}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{career.location}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={career.status} 
                                            color={career.status === 'active' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(career.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box display="flex" justifyContent="flex-end">
                                            <Tooltip title="View Details">
                                                <IconButton onClick={() => handleEdit(career)}>
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleEdit(career)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton onClick={() => confirmDelete(career)}>
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

            <Box display="flex" justifyContent="center" mt={3}>
                <Pagination 
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                />
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the job listing "{selectedCareer?.title}"? 
                        This action will also delete all associated applications.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CareerList;
