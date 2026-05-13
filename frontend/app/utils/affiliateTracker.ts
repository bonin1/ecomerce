// Affiliate tracking utility functions

interface AffiliateTrackingData {
    affiliateId: number;
    affiliateCode: string;
    clickId: number;
    timestamp: number;
}

interface TrackClickParams {
    affiliateCode: string;
    productId?: number;
    landingPage: string;
}

interface TrackConversionParams {
    orderId: number;
    orderTotal: number;
}

export class AffiliateTracker {
    private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    // Extract affiliate code from URL parameters
    static getAffiliateCodeFromUrl(): string | null {
        if (typeof window === 'undefined') return null;
        
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ref') || urlParams.get('affiliate') || urlParams.get('aff');
    }

    // Track affiliate click
    static async trackClick(params: TrackClickParams): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/affiliate/track-click`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(params)
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Failed to track affiliate click:', error);
            return false;
        }
    }

    // Track conversion when order is placed
    static async trackConversion(params: TrackConversionParams): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/affiliate/track-conversion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(params)
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Failed to track affiliate conversion:', error);
            return false;
        }
    }

    // Get affiliate tracking data from cookie
    static getTrackingData(): AffiliateTrackingData | null {
        if (typeof document === 'undefined') return null;

        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('affiliate_tracking='))
            ?.split('=')[1];

        if (!cookieValue) return null;

        try {
            return JSON.parse(decodeURIComponent(cookieValue));
        } catch (error) {
            console.error('Failed to parse affiliate tracking data:', error);
            return null;
        }
    }

    // Check if user came from affiliate link
    static isAffiliateTraffic(): boolean {
        return this.getTrackingData() !== null;
    }

    // Generate affiliate link for a product
    static generateAffiliateLink(productId: number, affiliateCode: string, baseUrl?: string): string {
        const productUrl = baseUrl || `${window.location.origin}/product/${productId}`;
        const url = new URL(productUrl);
        url.searchParams.set('ref', affiliateCode);
        return url.toString();
    }

    // Generate affiliate link for any page
    static generateAffiliatePageLink(pagePath: string, affiliateCode: string, baseUrl?: string): string {
        const pageUrl = baseUrl || `${window.location.origin}${pagePath}`;
        const url = new URL(pageUrl);
        url.searchParams.set('ref', affiliateCode);
        return url.toString();
    }

    // Initialize tracking on page load
    static async initializeTracking(): Promise<void> {
        if (typeof window === 'undefined') return;

        const affiliateCode = this.getAffiliateCodeFromUrl();
        if (!affiliateCode) return;

        // Extract product ID if on product page
        const pathParts = window.location.pathname.split('/');
        const productId = pathParts[1] === 'product' ? parseInt(pathParts[2]) : undefined;

        // Track the click
        await this.trackClick({
            affiliateCode,
            productId,
            landingPage: window.location.href
        });

        // Store affiliate code in session storage for cross-page tracking
        sessionStorage.setItem('current_affiliate', affiliateCode);
    }

    // Get current affiliate code from session
    static getCurrentAffiliate(): string | null {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem('current_affiliate');
    }

    // Clear affiliate tracking
    static clearTracking(): void {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem('current_affiliate');
        // Cookie is cleared server-side after conversion
    }
}

// Hook for React components
export const useAffiliateTracking = () => {
    const trackClick = async (params: TrackClickParams) => {
        return await AffiliateTracker.trackClick(params);
    };

    const trackConversion = async (params: TrackConversionParams) => {
        return await AffiliateTracker.trackConversion(params);
    };

    const isAffiliateTraffic = () => {
        return AffiliateTracker.isAffiliateTraffic();
    };

    const getCurrentAffiliate = () => {
        return AffiliateTracker.getCurrentAffiliate();
    };

    const generateAffiliateLink = (productId: number, affiliateCode: string) => {
        return AffiliateTracker.generateAffiliateLink(productId, affiliateCode);
    };

    return {
        trackClick,
        trackConversion,
        isAffiliateTraffic,
        getCurrentAffiliate,
        generateAffiliateLink
    };
};

export default AffiliateTracker;
