'use client';

import { useEffect, useState } from 'react';

export default function SiteMaintenanceBanner() {
    const [banner, setBanner] = useState('');

    useEffect(() => {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        let cancelled = false;
        fetch(`${base}/public/site-config`, { credentials: 'omit' })
            .then((r) => r.json())
            .then((d: { data?: { maintenance_banner?: string } }) => {
                if (cancelled) return;
                const text = d?.data?.maintenance_banner;
                if (text && String(text).trim()) setBanner(String(text).trim());
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    if (!banner) return null;

    return (
        <div
            role="status"
            style={{
                background: '#fef3c7',
                color: '#92400e',
                padding: '10px 16px',
                textAlign: 'center',
                fontSize: 14,
                borderBottom: '1px solid #fcd34d',
            }}
        >
            {banner}
        </div>
    );
}
