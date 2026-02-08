'use client';

import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import AffiliateStatsDashboard from '../components/affiliate/AffiliateStats';
import AffiliateList from '../components/affiliate/AffiliateList';
import Sidebar from '../components/Sidebar/sidebar';
import './affiliate.scss';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`affiliate-tabpanel-${index}`}
            aria-labelledby={`affiliate-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `affiliate-tab-${index}`,
        'aria-controls': `affiliate-tabpanel-${index}`,
    };
}

const AffiliateManagement: React.FC = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <>
        <Sidebar />
        <Box sx={{ width: '100%' }} className="affiliate-management-container">
            
            <Typography variant="h4" sx={{ mb: 3 }}>
                Affiliate Program Management
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="affiliate management tabs">
                    <Tab label="Dashboard" {...a11yProps(0)} />
                    <Tab label="Affiliates" {...a11yProps(1)} />
                </Tabs>
            </Box>
            
            <TabPanel value={value} index={0}>
                <AffiliateStatsDashboard />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <AffiliateList />
            </TabPanel>
        </Box>
        </>
    );
};

export default AffiliateManagement;
