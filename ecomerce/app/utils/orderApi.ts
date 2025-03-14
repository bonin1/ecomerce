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
}

export interface OrderResponse {
  message: string;
  order: {
    id: number;
    order_number: string;
    total_amount: number;
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
  return await apiClient('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};

export const getOrders = async () => {
  return await apiClient('/orders');
};

export const getOrderById = async (orderId: string | number) => {
  return await apiClient(`/orders/${orderId}`);
};

export const cancelOrder = async (orderId: string | number) => {
  return await apiClient(`/orders/${orderId}/cancel`, {
    method: 'POST',
  });
};

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await apiClient('/payment-methods');
  return response?.data || [];
};
