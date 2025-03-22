'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import ApplicationList from '@/app/admin/components/career/ApplicationList';
import Cookies from 'js-cookie';
import { Box, Container, Typography } from '@mui/material';
import '@/app/admin/dashboard/dashboard.scss'; 

const ApplicationsPage = () => {
    const router = useRouter();
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

    if (!adminUser) {
        return null;
    }

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main">
                <Container maxWidth={false}>
                    <Box mb={4}>
                        <Typography variant="h4" gutterBottom>
                        Job Applications
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                        Review and manage job applications
                        </Typography>
                    </Box>
                    
                    <ApplicationList />
                </Container>
            </main>
        </div>
    );
};

export default ApplicationsPage;
