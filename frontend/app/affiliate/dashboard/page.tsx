'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Grid, 
    Paper, 
    Typography, 
    Card, 
    CardContent,
    Button,
    TextField,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { 
    ContentCopy as CopyIcon,
    Share as ShareIcon,
    TrendingUp as TrendingUpIcon,
    AttachMoney as MoneyIcon,
    Mouse as ClickIcon,
    Assessment as ConversionIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiClient } from '../../utils/apiClient';
import { useAffiliateTracking } from '../../utils/affiliateTracker';

interface AffiliatePerformance {
    affiliate: {
        id: number;
        fullName: string;
        affiliateCode: string;
        commissionRate: number;
    };
    performance: {
        totalClicks: number;
        totalConversions: number;
        totalCommissions: number;
        conversionRate: number;
    };
    recentClicks: Array<{
        id: number;
        productId?: number;
        landingPage: string;
        isConverted: boolean;
        commissionAmount: number;
        createdAt: string;
        conversionDate?: string;
    }>;
}

const AffiliateDashboard: React.FC = () => {
    const [performance, setPerformance] = useState<AffiliatePerformance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [productId, setProductId] = useState('');
    const [customPath, setCustomPath] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const { generateAffiliateLink } = useAffiliateTracking();

    // Get affiliate code from URL or local storage
    const getAffiliateCode = (): string | null => {
        // You can modify this to get from user session, local storage, or props
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('code') || localStorage.getItem('affiliateCode');
    };

    useEffect(() => {
        const fetchPerformance = async () => {
            const affiliateCode = getAffiliateCode();
            if (!affiliateCode) {
                setError('No affiliate code provided. Please use the correct affiliate dashboard link.');
                setLoading(false);
                return;
            }

            try {
                const response = await apiClient<AffiliatePerformance>(`/affiliate/performance/${affiliateCode}`);
                if (response.success) {
                    setPerformance(response.data ?? null);
                } else {
                    setError('Failed to load affiliate performance data');
                }
            } catch (err) {
                console.error('Error fetching performance:', err);
                setError('Failed to load affiliate data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchPerformance();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const generateLink = () => {
        if (!performance) return;

        let link = '';
        if (productId) {
            link = generateAffiliateLink(parseInt(productId), performance.affiliate.affiliateCode);
        } else if (customPath) {
            const baseUrl = window.location.origin;
            const url = new URL(`${baseUrl}${customPath.startsWith('/') ? customPath : '/' + customPath}`);
            url.searchParams.set('ref', performance.affiliate.affiliateCode);
            link = url.toString();
        } else {
            // Generate general homepage link
            const url = new URL(window.location.origin);
            url.searchParams.set('ref', performance.affiliate.affiliateCode);
            link = url.toString();
        }

        setGeneratedLink(link);
    };

    const shareLink = async (link: string) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Check out these amazing products!',
                    url: link
                });
            } catch (error) {
                copyToClipboard(link);
            }
        } else {
            copyToClipboard(link);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!performance) {
        return (
            <Alert severity="warning" sx={{ mt: 2 }}>
                No performance data available
            </Alert>
        );
    }

    const statsCards = [
        {
            title: 'Total Clicks',
            value: performance.performance.totalClicks.toLocaleString(),
            icon: <ClickIcon sx={{ fontSize: 40, color: '#3b82f6' }} />,
            color: '#3b82f6'
        },
        {
            title: 'Conversions',
            value: performance.performance.totalConversions.toLocaleString(),
            icon: <ConversionIcon sx={{ fontSize: 40, color: '#10b981' }} />,
            color: '#10b981'
        },
        {
            title: 'Conversion Rate',
            value: `${performance.performance.conversionRate}%`,
            icon: <TrendingUpIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
            color: '#f59e0b'
        },
        {
            title: 'Total Earnings',
            value: `$${performance.performance.totalCommissions.toFixed(2)}`,
            icon: <MoneyIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />,
            color: '#8b5cf6'
        }
    ];

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Affiliate Dashboard
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <Typography variant="h6">Welcome, {performance.affiliate.fullName}!</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Affiliate Code: <strong>{performance.affiliate.affiliateCode}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Commission Rate: <strong>{performance.affiliate.commissionRate}%</strong>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="contained"
                            startIcon={<ShareIcon />}
                            onClick={() => setLinkDialogOpen(true)}
                            fullWidth
                        >
                            Generate Affiliate Links
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statsCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box>{card.icon}</Box>
                                <Box>
                                    <Typography variant="h4" sx={{ color: card.color, fontWeight: 'bold' }}>
                                        {card.value}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {card.title}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Recent Activity
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Landing Page</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Commission</TableCell>
                                <TableCell>Conversion Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {performance.recentClicks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No activity yet. Start sharing your affiliate links!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                performance.recentClicks.map((click) => (
                                    <TableRow key={click.id}>
                                        <TableCell>
                                            {new Date(click.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {click.landingPage}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={click.isConverted ? 'Converted' : 'Click'}
                                                color={click.isConverted ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {click.isConverted ? `$${click.commissionAmount.toFixed(2)}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {click.conversionDate ? new Date(click.conversionDate).toLocaleDateString() : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Link Generation Dialog */}
            <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Generate Affiliate Link</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Product ID (optional)"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            placeholder="e.g., 123"
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Custom Page Path (optional)"
                            value={customPath}
                            onChange={(e) => setCustomPath(e.target.value)}
                            placeholder="e.g., /categories/electronics"
                            sx={{ mb: 2 }}
                        />
                        <Button
                            variant="outlined"
                            onClick={generateLink}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            Generate Link
                        </Button>
                        {generatedLink && (
                            <TextField
                                fullWidth
                                label="Generated Affiliate Link"
                                value={generatedLink}
                                multiline
                                rows={3}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Tooltip title="Copy Link">
                                                <IconButton onClick={() => copyToClipboard(generatedLink)}>
                                                    <CopyIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Share Link">
                                                <IconButton onClick={() => shareLink(generatedLink)}>
                                                    <ShareIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLinkDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AffiliateDashboard;
