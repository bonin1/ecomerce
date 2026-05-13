import { apiClient } from '@/app/utils/apiClient';

export async function wishlistStatus(productId: number) {
    return apiClient(`/wishlist/status/${productId}`);
}

export async function addToWishlist(productId: number) {
    return apiClient('/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
    });
}

export async function removeFromWishlist(productId: number) {
    return apiClient(`/wishlist/${productId}`, { method: 'DELETE' });
}

export async function fetchWishlist() {
    return apiClient('/wishlist');
}
