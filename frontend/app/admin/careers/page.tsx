'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import CareerList from '@/app/admin/components/career/CareerList';
import CareerStatsDashboard from '@/app/admin/components/career/CareerStats';
import Cookies from 'js-cookie';
import { Box, Container, Paper, Typography, Tabs, Tab } from '@mui/material';
import '@/app/admin/dashboard/dashboard.scss';

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
            id={`career-tabpanel-${index}`}
            aria-labelledby={`career-tab-${index}`}
            {...other}
            >
            {value === index && (
                <Box sx={{ py: 3 }}>
                {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `career-tab-${index}`,
        'aria-controls': `career-tabpanel-${index}`,
    };
}

const CareersPage = () => {
    const router = useRouter();
    const [tabValue, setTabValue] = useState(0);
    const [adminUser, setAdminUser] = useState<any>(null);

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
    }, [router]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (!adminUser) {
        return null;    
    }

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main">
                <Container maxWidth={false}>
                    <Typography variant="h4" gutterBottom>
                        Career Management
                    </Typography>
                    
                    <Paper sx={{ mb: 4 }}>
                        <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="career management tabs"
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab label="Dashboard" {...a11yProps(0)} />
                            <Tab label="Job Listings" {...a11yProps(1)} />
                        </Tabs>
                        
                        <TabPanel value={tabValue} index={0}>
                            <CareerStatsDashboard />
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={1}>
                            <CareerList />
                        </TabPanel>
                    </Paper>
                </Container>
            </main>
        </div>
    );
};

export default CareersPage;
