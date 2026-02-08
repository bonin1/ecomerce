'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    CircularProgress,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiClient } from '../../../utils/apiClient';
import { Affiliate } from '../../../types';

interface AffiliateFormProps {
    affiliate: Affiliate | null;
    onClose: () => void;
    onSubmitSuccess: () => void;
    isViewMode?: boolean;
}

const AffiliateForm: React.FC<AffiliateFormProps> = ({
    affiliate,
    onClose,
    onSubmitSuccess,
    isViewMode = false
}) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        website: '',
        socialMedia: '',
        message: '',
        status: 'pending' as 'pending' | 'approved' | 'rejected' | 'suspended',
        commissionRate: 10,
        paymentMethod: '' as 'paypal' | 'bank_transfer' | 'cryptocurrency' | '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (affiliate) {
            setFormData({
                fullName: affiliate.fullName || '',
                email: affiliate.email || '',
                website: affiliate.website || '',
                socialMedia: affiliate.socialMedia || '',
                message: affiliate.message || '',
                status: affiliate.status,
                commissionRate: affiliate.commissionRate || 10,
                paymentMethod: affiliate.paymentMethod || '',
                notes: affiliate.notes || ''
            });
        }
    }, [affiliate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'commissionRate' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewMode) return;

        setLoading(true);
        setError(null);

        try {
            const response = await apiClient(`/affiliate/admin/${affiliate?.id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (response.success) {
                onSubmitSuccess();
            } else {
                setError(response.message || 'Failed to update affiliate');
            }
        } catch (err) {
            console.error('Error updating affiliate:', err);
            setError('Failed to update affiliate. Please try again.');
        } finally {
            setLoading(false);
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

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={onClose}
                    sx={{ mr: 2 }}
                >
                    Back to List
                </Button>
                <Typography variant="h5">
                    {isViewMode ? 'View' : 'Edit'} Affiliate: {affiliate?.fullName}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Basic Information
                        </Typography>
                        
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        disabled={isViewMode}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        disabled={isViewMode}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Website"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        disabled={isViewMode}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Social Media"
                                        name="socialMedia"
                                        value={formData.socialMedia}
                                        onChange={handleChange}
                                        disabled={isViewMode}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Application Message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        multiline
                                        rows={3}
                                        disabled={isViewMode}
                                    />
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Affiliate Settings
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={formData.status}
                                            label="Status"
                                            onChange={(e) => handleSelectChange('status', e.target.value)}
                                            disabled={isViewMode}
                                        >
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="approved">Approved</MenuItem>
                                            <MenuItem value="rejected">Rejected</MenuItem>
                                            <MenuItem value="suspended">Suspended</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Commission Rate (%)"
                                        name="commissionRate"
                                        type="number"
                                        value={formData.commissionRate}
                                        onChange={handleChange}
                                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                                        disabled={isViewMode}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Payment Method</InputLabel>
                                        <Select
                                            value={formData.paymentMethod}
                                            label="Payment Method"
                                            onChange={(e) => handleSelectChange('paymentMethod', e.target.value)}
                                            disabled={isViewMode}
                                        >
                                            <MenuItem value="">Not Set</MenuItem>
                                            <MenuItem value="paypal">PayPal</MenuItem>
                                            <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                            <MenuItem value="cryptocurrency">Cryptocurrency</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Admin Notes"
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        multiline
                                        rows={3}
                                        disabled={isViewMode}
                                        placeholder="Internal notes about this affiliate..."
                                    />
                                </Grid>
                                
                                {!isViewMode && (
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                                            <Button onClick={onClose}>
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                disabled={loading}
                                                startIcon={loading ? <CircularProgress size={16} /> : null}
                                            >
                                                {loading ? 'Updating...' : 'Update Affiliate'}
                                            </Button>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </form>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Affiliate Details
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Current Status
                                </Typography>
                                <Chip
                                    label={affiliate?.status ? (affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)) : 'Unknown'}
                                    color={getStatusColor(affiliate?.status || 'pending') as any}
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>

                            {affiliate?.affiliateCode && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Affiliate Code
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                        {affiliate.affiliateCode}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total Earnings
                                </Typography>
                                <Typography variant="h6" color="success.main">
                                    ${affiliate?.totalEarnings.toFixed(2) || '0.00'}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Clicks / Conversions
                                </Typography>
                                <Typography variant="body1">
                                    {affiliate?.totalClicks || 0} / {affiliate?.totalConversions || 0}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Conversion Rate
                                </Typography>
                                <Typography variant="body1">
                                    {affiliate?.totalClicks && affiliate.totalClicks > 0 
                                        ? ((affiliate.totalConversions / affiliate.totalClicks) * 100).toFixed(2)
                                        : 0}%
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Applied Date
                                </Typography>
                                <Typography variant="body1">
                                    {affiliate?.createdAt ? new Date(affiliate.createdAt).toLocaleDateString() : 'N/A'}
                                </Typography>
                            </Box>

                            {affiliate?.approvedAt && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Approved Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(affiliate.approvedAt).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AffiliateForm;
