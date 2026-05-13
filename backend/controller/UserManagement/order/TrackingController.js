const Order = require('../../../model/OrderModel');
const OrderTracking = require('../../../model/OrderTrackingModel');
const User = require('../../../model/UserModel');
const db = require('../../../database');
const emailService = require('../../../services/emailServices');


exports.addTrackingUpdate = async (req, res) => {
    const transaction = await db.transaction();

    try {
        const { orderId } = req.params;
        const { 
            status, 
            location, 
            description, 
            carrier, 
            carrierTrackingNumber, 
            estimatedDelivery,
            notifyCustomer 
        } = req.body;

        const order = await Order.findByPk(orderId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ],
            transaction
        });

        if (!order) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const tracking = await OrderTracking.create({
            order_id: orderId,
            status,
            location,
            description,
            carrier,
            carrier_tracking_number: carrierTrackingNumber,
            estimated_delivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
            updated_by: req.user.id,
            is_customer_notified: false
        }, { transaction });

        const orderUpdateData = {
            status: status === 'delivered' ? 'delivered' : 
                   status === 'shipped' || status === 'out_for_delivery' ? 'shipped' :
                   status === 'cancelled' ? 'cancelled' : 'processing'
        };

        if (carrierTrackingNumber) {
            orderUpdateData.tracking_number = carrierTrackingNumber;
        }

        if (estimatedDelivery) {
            orderUpdateData.estimated_delivery_date = new Date(estimatedDelivery);
        }

        await order.update(orderUpdateData, { transaction });

        await transaction.commit();

        if (notifyCustomer && order.user && order.user.email) {
            try {
                const customerFullName = `${order.user.name || 'Valued Customer'}`;
                
                await emailService.sendTrackingUpdateEmail(order.user.email, {
                    customerName: customerFullName,
                    orderNumber: order.order_number,
                    status,
                    location,
                    carrier,
                    trackingNumber: carrierTrackingNumber,
                    estimatedDelivery,
                    description
                });

                await tracking.update({ is_customer_notified: true });
            } catch (emailError) {
                console.error('Failed to send tracking update email:', emailError);
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Tracking information updated successfully',
            data: tracking
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating tracking:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update tracking information',
            error: error.message
        });
    }
};

exports.getOrderTrackingHistoryAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const trackingHistory = await OrderTracking.findAll({
            where: { order_id: orderId },
            order: [['createdAt', 'DESC']]
        });
        
        return res.status(200).json({
            success: true,
            data: trackingHistory
        });
    } catch (error) {
        console.error('Error retrieving tracking history:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve tracking history',
            error: error.message
        });
    }
};

exports.getLatestTrackingStatusAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const latestTracking = await OrderTracking.findOne({
            where: { order_id: orderId },
            order: [['createdAt', 'DESC']]
        });
        
        if (!latestTracking) {
            return res.status(404).json({
                success: false,
                message: 'No tracking information available for this order'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: latestTracking
        });
    } catch (error) {
        console.error('Error retrieving latest tracking:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve latest tracking information',
            error: error.message
        });
    }
};

exports.resendTrackingNotification = async (req, res) => {
    try {
        const { trackingId } = req.params;
        
        const tracking = await OrderTracking.findByPk(trackingId, {
            include: [
                {
                    model: Order,
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                }
            ]
        });
        
        if (!tracking) {
            return res.status(404).json({
                success: false,
                message: 'Tracking record not found'
            });
        }
        
        if (!tracking.Order || !tracking.Order.user) {
            return res.status(404).json({
                success: false,
                message: 'Order or user information not found'
            });
        }
        
        const customerEmail = tracking.Order.user.email;
        const customerFullName = tracking.Order.user.name || 'Valued Customer';
        
        await emailService.sendTrackingUpdateEmail(customerEmail, {
            customerName: customerFullName,
            orderNumber: tracking.Order.order_number,
            status: tracking.status,
            location: tracking.location,
            carrier: tracking.carrier,
            trackingNumber: tracking.carrier_tracking_number,
            estimatedDelivery: tracking.estimated_delivery,
            description: tracking.description
        });
        
        await tracking.update({ is_customer_notified: true });
        
        return res.status(200).json({
            success: true,
            message: 'Tracking notification sent successfully'
        });
    } catch (error) {
        console.error('Error sending tracking notification:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send tracking notification',
            error: error.message
        });
    }
};