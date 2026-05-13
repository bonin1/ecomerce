'use client';

import { useEffect } from 'react';
import AffiliateTracker from '../../utils/affiliateTracker';

const AffiliateTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        // Initialize affiliate tracking on page load
        AffiliateTracker.initializeTracking();
    }, []);

    return <>{children}</>;
};

export default AffiliateTrackingProvider;
