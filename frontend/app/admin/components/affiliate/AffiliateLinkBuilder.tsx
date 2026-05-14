'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import { apiClient } from '@/app/utils/apiClient';
import type { Affiliate, AffiliatesResponse } from '@/app/types';
import AffiliateTracker from '@/app/utils/affiliateTracker';

type LinkKind = 'product' | 'home' | 'categories' | 'search';

export default function AffiliateLinkBuilder() {
    const [loading, setLoading] = useState(true);
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [affiliateId, setAffiliateId] = useState<number | ''>('');
    const [linkKind, setLinkKind] = useState<LinkKind>('product');
    const [productId, setProductId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: '1',
                limit: '200',
                status: 'approved',
            });
            const res = (await apiClient(`/affiliate/admin/all?${params}`)) as AffiliatesResponse;
            if (res.success && res.data?.affiliates) {
                const withCode = res.data.affiliates.filter((a) => a.affiliateCode);
                setAffiliates(withCode);
                setAffiliateId((prev) => {
                    if (prev !== '') return prev;
                    return withCode[0]?.id ?? '';
                });
            } else {
                toast.error('Could not load affiliates');
            }
        } catch {
            toast.error('Could not load affiliates');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const selected = useMemo(
        () => affiliates.find((a) => a.id === affiliateId),
        [affiliates, affiliateId]
    );

    const builtLink = useMemo(() => {
        if (typeof window === 'undefined' || !selected?.affiliateCode) return '';
        const code = selected.affiliateCode;
        if (linkKind === 'product') {
            const id = parseInt(productId, 10);
            if (Number.isNaN(id) || id <= 0) return '';
            return AffiliateTracker.generateAffiliateLink(id, code);
        }
        if (linkKind === 'home') {
            return AffiliateTracker.generateAffiliatePageLink('/', code);
        }
        if (linkKind === 'categories') {
            return AffiliateTracker.generateAffiliatePageLink('/categories', code);
        }
        const q = searchQuery.trim();
        if (!q) return '';
        const path = `/search?q=${encodeURIComponent(q)}`;
        return AffiliateTracker.generateAffiliatePageLink(path, code);
    }, [linkKind, productId, searchQuery, selected?.affiliateCode]);

    const copy = async () => {
        if (!builtLink) {
            toast.error('Complete the fields to build a link');
            return;
        }
        try {
            await navigator.clipboard.writeText(builtLink);
            toast.success('Link copied');
        } catch {
            toast.error('Copy failed');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!affiliates.length) {
        return (
            <Alert severity="info">
                No approved affiliates with an assigned code yet. Approve an application in the Partners tab first.
            </Alert>
        );
    }

    return (
        <Box sx={{ maxWidth: 640 }}>
            <Typography variant="h6" gutterBottom>
                Tracking link builder
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Build storefront URLs with the <code>ref</code> query parameter so clicks attribute to the right partner.
            </Typography>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="aff-pick">Partner</InputLabel>
                <Select
                    labelId="aff-pick"
                    label="Partner"
                    value={affiliateId === '' ? '' : String(affiliateId)}
                    onChange={(e) => setAffiliateId(Number(e.target.value))}
                >
                    {affiliates.map((a) => (
                        <MenuItem key={a.id} value={String(a.id)}>
                            {a.fullName} ({a.affiliateCode})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="link-kind">Destination</InputLabel>
                <Select
                    labelId="link-kind"
                    label="Destination"
                    value={linkKind}
                    onChange={(e) => setLinkKind(e.target.value as LinkKind)}
                >
                    <MenuItem value="product">Product page</MenuItem>
                    <MenuItem value="home">Homepage</MenuItem>
                    <MenuItem value="categories">Categories</MenuItem>
                    <MenuItem value="search">Search</MenuItem>
                </Select>
            </FormControl>

            {linkKind === 'product' && (
                <TextField
                    fullWidth
                    size="small"
                    label="Product ID"
                    type="number"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Numeric id from the catalog or admin product list."
                />
            )}

            {linkKind === 'search' && (
                <TextField
                    fullWidth
                    size="small"
                    label="Search query"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ mb: 2 }}
                />
            )}

            <TextField
                fullWidth
                size="small"
                label="Generated link"
                value={builtLink}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
                multiline
                minRows={linkKind === 'search' ? 2 : 1}
            />

            <Button variant="contained" onClick={() => void copy()} disabled={!builtLink}>
                Copy link
            </Button>
        </Box>
    );
}
