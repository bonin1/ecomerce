'use client';
import React, { useState, useEffect } from 'react';
import { CareerApplication } from '@/app/types';
import { apiClient } from '@/app/utils/apiClient';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    TextField,
    MenuItem,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    CircularProgress,
    Alert,
    Tooltip,
    FormControlLabel,
    Switch,
    Tabs,
    Tab
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const statusColors: Record<string, "success" | "error" | "warning" | "default"> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
};

interface ApplicationDetailsProps {
    application: CareerApplication;
    onClose: () => void;
    onStatusChange: (id: number, status: string, feedbackNote?: string) => Promise<void>;
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ 
    application, 
    onClose,
    onStatusChange
}) => {
    const [loading, setLoading] = useState(false);
    const [feedbackNote, setFeedbackNote] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    const handleStatusChange = async (status: string) => {
        setLoading(true);
        try {
            await onStatusChange(application.id, status, feedbackNote);
            onClose();
        } catch (error) {
            console.error('Error changing status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileType: 'resume' | 'coverLetter') => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const token = localStorage.getItem('adminToken');
            
            const url = `${baseUrl}/careers/applications/${application.id}/download?fileType=${fileType}&token=${token}`;
            
            window.open(url, '_blank');
        } catch (error: any) {
            console.error(`Error downloading ${fileType}:`, error);
            alert(`Failed to download ${fileType === 'resume' ? 'resume' : 'cover letter'}`);
        }
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Application Details</Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            
            <DialogContent dividers>
                <Tabs 
                    value={activeTab} 
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Applicant Details" />
                    <Tab label="Job Details" />
                    <Tab label="Documents" />
                </Tabs>
                
                {activeTab === 0 && (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">{application.name}</Typography>
                            <Chip 
                                label={application.status} 
                                color={statusColors[application.status]}
                            />
                        </Box>
                        
                        <Box mb={3}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Applied for: <strong>{application.career?.title}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Applied on: {new Date(application.createdAt).toLocaleDateString()}
                            </Typography>
                        </Box>
                        
                        <Typography variant="subtitle1" gutterBottom>Contact Information</Typography>
                        <Box mb={3}>
                            <Typography variant="body1" gutterBottom>
                                Email: {application.email}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                Phone: {application.phone}
                            </Typography>
                            
                            <Box mt={2}>
                                <Button 
                                    startIcon={<EmailIcon />}
                                    variant="outlined"
                                    size="small"
                                    href={`mailto:${application.email}`}
                                >
                                    Send Email
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}
                
                {activeTab === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            {application.career?.title}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom>
                            {application.career?.location}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Job Description:
                        </Typography>
                        
                        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                            <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                                {application.career?.description}
                            </Typography>
                        </Paper>
                    </Box>
                )}
                
                {activeTab === 2 && (
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>Application Documents</Typography>
                        
                        <Box display="flex" gap={2} mt={2} mb={4}>
                            <Button 
                                variant="outlined" 
                                startIcon={<CloudDownloadIcon />}
                                onClick={() => handleDownload('resume')}
                            >
                                Download Resume
                            </Button>
                            
                            <Button 
                                variant="outlined" 
                                startIcon={<CloudDownloadIcon />}
                                onClick={() => handleDownload('coverLetter')}
                            >
                                Download Cover Letter
                            </Button>
                        </Box>
                    </Box>
                )}
                
                {application.status === 'pending' && (
                    <Box mt={3}>
                        <Typography variant="subtitle1" gutterBottom>Application Feedback</Typography>
                        <TextField
                            label="Feedback for applicant (optional)"
                            fullWidth
                            multiline
                            rows={3}
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            placeholder="This feedback will be sent to the applicant when you approve or reject"
                            margin="normal"
                        />
                    </Box>
                )}
            </DialogContent>
            
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Button onClick={onClose} variant="outlined">Close</Button>
                
                {application.status === 'pending' && (
                    <Box>
                        <Button 
                            variant="contained" 
                            color="error"
                            onClick={() => handleStatusChange('rejected')}
                            startIcon={loading ? <CircularProgress size={20} /> : <CloseIcon />}
                            disabled={loading}
                            sx={{ mr: 1 }}
                        >
                            Reject
                        </Button>
                        <Button 
                            variant="contained" 
                            color="success"
                            onClick={() => handleStatusChange('approved')}
                            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                            disabled={loading}
                        >
                            Approve
                        </Button>
                    </Box>
                )}
            </DialogActions>
        </Dialog>
    );
};

const ApplicationList: React.FC = () => {
    const [applications, setApplications] = useState<CareerApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedCareerId, setSelectedCareerId] = useState<string>('');
    const [careers, setCareers] = useState<{ id: number, title: string }[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<CareerApplication | null>(null);
    const [bulkActionEnabled, setBulkActionEnabled] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkStatus, setBulkStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');

    const fetchApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '10');
            
            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }
            
            if (selectedCareerId) {
                params.append('careerId', selectedCareerId);
            }
            
            const response = await apiClient(`/careers/applications?${params.toString()}`);
            
            if (response.success) {
                setApplications(response.data);
                setTotalPages(response.totalPages || 1);
            } else {
                setError('Failed to load applications');
            }
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError('Failed to load applications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCareers = async () => {
        try {
            const response = await apiClient('/careers/listings?status=active&limit=100');
            if (response.success) {
                setCareers(response.data.map((career: any) => ({
                    id: career.id,
                    title: career.title
                })));
            }
        } catch (err) {
            console.error('Error fetching careers for dropdown:', err);
        }
    };

    useEffect(() => {
        fetchCareers();
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [page, selectedStatus, selectedCareerId]);

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedStatus(event.target.value);
        setPage(1); // Reset to first page
    };

    const handleCareerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedCareerId(event.target.value);
        setPage(1); // Reset to first page
    };

    const handleViewDetails = (application: CareerApplication) => {
        setSelectedApplication(application);
        setDetailsOpen(true);
    };

    const handleStatusUpdate = async (id: number, status: string, feedbackNote?: string): Promise<void> => {
        try {
            const response = await apiClient(`/careers/applications/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({
                    status,
                    feedbackNote
                })
            });
            
            if (response.success) {
                // Update application in the list with proper typing
                setApplications(prev => 
                    prev.map(app => 
                        app.id === id ? { ...app, status: status as CareerApplication['status'] } : app
                    )
                );
                
                // Update selected application if it's open
                if (selectedApplication && selectedApplication.id === id) {
                    setSelectedApplication(prev => 
                        prev ? { ...prev, status: status as CareerApplication['status'] } : null
                    );
                }
                
                // Return void instead of boolean
            } else {
                throw new Error('Failed to update status');
            }
        } catch (err) {
            console.error('Error updating application status:', err);
            setError('Failed to update application status. Please try again.');
            throw err;
        }
    };

    const handleBulkSelection = (appId: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, appId]);
        } else {
            setSelectedIds(prev => prev.filter(id => id !== appId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(applications.map(app => app.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkStatusUpdate = async () => {
        if (selectedIds.length === 0) return;
        
        try {
            const response = await apiClient('/careers/applications/bulk-update-status', {
                method: 'PUT',
                body: JSON.stringify({
                    applicationIds: selectedIds,
                    status: bulkStatus
                })
            });
            
            if (response.success) {
                fetchApplications();
                setSelectedIds([]);
                setBulkActionEnabled(false);
            } else {
                setError('Failed to update application statuses');
            }
        } catch (err) {
            console.error('Error updating application statuses:', err);
            setError('Failed to update application statuses. Please try again.');
        }
    };

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
            >
                <Typography variant="h5">Job Applications</Typography>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                    <TextField
                        select
                        label="Status"
                        value={selectedStatus}
                        onChange={handleStatusChange}
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </TextField>
                    
                    <TextField
                        select
                        label="Job Position"
                        value={selectedCareerId}
                        onChange={handleCareerChange}
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 250 }}
                    >
                        <MenuItem value="">All Positions</MenuItem>
                        {careers.map((career) => (
                            <MenuItem key={career.id} value={career.id.toString()}>
                                {career.title}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>
                
                {bulkActionEnabled && selectedIds.length > 0 && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography>
                                {selectedIds.length} application(s) selected
                            </Typography>
                            
                            <TextField
                                select
                                label="Set Status"
                                value={bulkStatus}
                                onChange={(e) => setBulkStatus(e.target.value as 'pending' | 'approved' | 'rejected')}
                                size="small"
                                sx={{ minWidth: 150 }}
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </TextField>
                            
                            <Button 
                                variant="contained" 
                                onClick={handleBulkStatusUpdate}
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
                                                checked={selectedIds.length === applications.length && applications.length > 0}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                size="small"
                                            />
                                        }
                                        label=""
                                    />
                                </TableCell>
                            )}
                            <TableCell>Applicant</TableCell>
                            <TableCell>Position</TableCell>
                            <TableCell>Applied Date</TableCell>
                            <TableCell>Status</TableCell>
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
                        ) : applications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={bulkActionEnabled ? 6 : 5} align="center" sx={{ py: 3 }}>
                                    No applications found
                                </TableCell>
                            </TableRow>
                        ) : (
                            applications.map((application) => (
                                <TableRow key={application.id}>
                                    {bulkActionEnabled && (
                                        <TableCell padding="checkbox">
                                            <FormControlLabel
                                                control={
                                                    <Switch 
                                                        checked={selectedIds.includes(application.id)}
                                                        onChange={(e) => handleBulkSelection(application.id, e.target.checked)}
                                                        size="small"
                                                    />
                                                }
                                                label=""
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Typography fontWeight="medium">
                                            {application.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {application.email}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {application.career?.title || `Job ID: ${application.career_id}`}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(application.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={application.status} 
                                            color={statusColors[application.status]}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box display="flex" justifyContent="flex-end">
                                            <Tooltip title="View Details">
                                                <IconButton onClick={() => handleViewDetails(application)}>
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            
                                            {application.status === 'pending' && (
                                                <>
                                                    <Tooltip title="Approve">
                                                        <IconButton 
                                                            onClick={() => handleStatusUpdate(application.id, 'approved')}
                                                            color="success"
                                                        >
                                                            <CheckIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Reject">
                                                        <IconButton 
                                                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                                            color="error"
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                            
                                            <Tooltip title="Email Applicant">
                                                <IconButton 
                                                    href={`mailto:${application.email}`}
                                                    component="a"
                                                    target="_blank"
                                                >
                                                    <EmailIcon fontSize="small" />
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

            {/* Application Details Dialog */}
            {detailsOpen && selectedApplication && (
                <ApplicationDetails
                    application={selectedApplication}
                    onClose={() => {
                        setDetailsOpen(false);
                        setSelectedApplication(null);
                    }}
                    onStatusChange={handleStatusUpdate}
                />
            )}
        </Box>
    );
};

export default ApplicationList;
