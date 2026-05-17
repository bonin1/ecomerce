import { apiClient } from './apiClient';

export interface OrderItem {
  id: number;
  quantity: number;
}

export interface OrderData {
  items: OrderItem[];
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  contactPhone: string;
  contactEmail: string;
  paymentMethod: string;
  notes?: string;
  couponCode?: string;
}

export interface OrderResponse {
  message: string;
  order: {
    id: number;
    order_number: string;
    total_amount: number;
    subtotal?: number;
    discount_amount?: number;
    coupon_code?: string | null;
    status: string;
    createdAt: string;
  };
}

export interface PaymentMethod {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  processing_time: string | null;
  fee_percentage: number | null;
  fee_fixed: number | null;
  min_amount: number | null;
  max_amount: number | null;
  display_order: number;
}

export const createOrder = async (orderData: OrderData): Promise<OrderResponse> => {
  return (await apiClient('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  })) as OrderResponse;
};

export const getOrders = async () => {
  const res = await apiClient('/orders');
  return Array.isArray(res.data) ? res.data : [];
};

export const getOrderById = async (orderId: string | number) => {
  const res = await apiClient(`/orders/${orderId}`);
  return res.data ?? null;
};

export const cancelOrder = async (orderId: string | number) => {
  return await apiClient(`/orders/${orderId}/cancel`, {
    method: 'POST',
  });
};

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await apiClient<PaymentMethod[]>('/payment-methods');
  return response.data ?? [];
};
