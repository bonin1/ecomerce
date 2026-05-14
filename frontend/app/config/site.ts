/** Public storefront / marketing copy — override via env for white-label deployments. */
export const SITE_NAME = (process.env.NEXT_PUBLIC_STORE_NAME || 'Our store').trim() || 'Our store';

export const AFFILIATE_DEFAULT_COMMISSION_PCT =
    (process.env.NEXT_PUBLIC_AFFILIATE_COMMISSION_PCT || '15').replace(/[^\d.]/g, '') || '15';
