const Order = require('../../../model/OrderModel');
const OrderTracking = require('../../../model/OrderTrackingModel');
const OrderItem = require('../../../model/OrderItemModel');

exports.getOrderTrackingByNumber = async (req, res) => {
    try {
        const { orderNumber, trackingNumber } = req.query;
        
        if (!orderNumber) {
            return res.status(400).json({
                success: false,
                message: 'Order number is required'
            });
        }
        
        const order = await Order.findOne({
            where: { order_number: orderNumber },
            attributes: ['id', 'order_number', 'status', 'tracking_number', 'estimated_delivery_date', 'createdAt']
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        if (trackingNumber && order.tracking_number !== trackingNumber) {
            return res.status(403).json({
                success: false,
                message: 'Invalid tracking information'
            });
        }
        
        const trackingHistory = await OrderTracking.findAll({
            where: { order_id: order.id },
            attributes: ['status', 'location', 'description', 'carrier', 'carrier_tracking_number', 'estimated_delivery', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        
        const orderItems = await OrderItem.findAll({
            where: { order_id: order.id },
            attributes: ['product_name', 'quantity']
        });
        
        const orderInfo = {
            orderNumber: order.order_number,
            orderDate: order.createdAt,
            currentStatus: order.status,
            trackingNumber: order.tracking_number,
            estimatedDeliveryDate: order.estimated_delivery_date,
            items: orderItems,
            trackingHistory: trackingHistory
        };
        
        return res.status(200).json({
            success: true,
            data: orderInfo
        });
    } catch (error) {
        console.error('Error retrieving order tracking:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve tracking information',
            error: error.message
        });
    }
};

exports.getOrderTrackingById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        
        const order = await Order.findOne({
            where: { 
                id: orderId,
                user_id: userId
            },
            attributes: ['id', 'order_number', 'status', 'tracking_number', 'estimated_delivery_date', 'createdAt']
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        const trackingHistory = await OrderTracking.findAll({
            where: { order_id: order.id },
            attributes: ['status', 'location', 'description', 'carrier', 'carrier_tracking_number', 'estimated_delivery', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        
        const orderItems = await OrderItem.findAll({
            where: { order_id: order.id },
            attributes: ['product_name', 'quantity']
        });
        
        const orderInfo = {
            orderId: order.id,
            orderNumber: order.order_number,
            orderDate: order.createdAt,
            currentStatus: order.status,
            trackingNumber: order.tracking_number,
            estimatedDeliveryDate: order.estimated_delivery_date,
            items: orderItems,
            trackingHistory: trackingHistory
        };
        
        return res.status(200).json({
            success: true,
            data: orderInfo
        });
    } catch (error) {
        console.error('Error retrieving order tracking:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve tracking information',
            error: error.message
        });
    }
};