const Order = require('../../model/OrderModel');
const OrderItem = require('../../model/OrderItemModel');
const User = require('../../model/UserModel');
const Product = require('../../model/ProduktModel');
const { Op } = require('sequelize');
const db = require('../../database');

// Get all orders with pagination and filters
exports.getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order || 'DESC';
        
        const whereClause = {};
        
        if (status && status !== 'all') {
            whereClause.status = status;
        }
        
        if (search) {
            whereClause[Op.or] = [
                { order_number: { [Op.like]: `%${search}%` } },
                { '$user.name$': { [Op.like]: `%${search}%` } },
                { '$user.email$': { [Op.like]: `%${search}%` } },
                { contact_email: { [Op.like]: `%${search}%` } }
            ];
        }
        
        const { count, rows: orders } = await Order.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            attributes: ['id', 'product_name', 'product_primary_image']
                        }
                    ]
                }
            ],
            order: [[sortBy, order]],
            offset,
            limit,
            distinct: true
        });
        
        return res.status(200).json({
            success: true,
            data: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                orders
            }
        });
    } catch (error) {
        console.error('Error retrieving orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders', 
            error: error.message
        });
    }
};

// Get a specific order by ID
exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findByPk(orderId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'phone_number']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            attributes: ['id', 'product_name', 'product_primary_image', 'product_price']
                        }
                    ]
                }
            ]
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error retrieving order:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve order',
            error: error.message
        });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    const transaction = await db.transaction();
    
    try {
        const { orderId } = req.params;
        const { status, payment_status, tracking_number, estimated_delivery_date } = req.body;
        
        const order = await Order.findByPk(orderId, { transaction });
        
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Update order with the provided fields
        const updateData = {};
        
        if (status) updateData.status = status;
        if (payment_status) updateData.payment_status = payment_status;
        if (tracking_number) updateData.tracking_number = tracking_number;
        if (estimated_delivery_date) updateData.estimated_delivery_date = estimated_delivery_date;
        
        await order.update(updateData, { transaction });
        
        // If order is being cancelled, return items to inventory
        if (status === 'cancelled' && order.status !== 'cancelled') {
            const orderItems = await OrderItem.findAll({
                where: { order_id: orderId },
                transaction
            });
            
            for (const item of orderItems) {
                const product = await Product.findByPk(item.product_id, { transaction });
                if (product) {
                    await product.update({
                        product_stock: product.product_stock + item.quantity
                    }, { transaction });
                }
            }
        }
        
        await transaction.commit();
        
        // Get the updated order with related data
        const updatedOrder = await Order.findByPk(orderId, {
            include: [
                {
                    model: OrderItem,
                    as: 'items'
                }
            ]
        });
        
        return res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            data: updatedOrder
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating order:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: error.message
        });
    }
};

// Get order statistics for dashboard
exports.getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.count();
        const pendingOrders = await Order.count({ where: { status: 'pending' } });
        const processingOrders = await Order.count({ where: { status: 'processing' } });
        const shippedOrders = await Order.count({ where: { status: 'shipped' } });
        const deliveredOrders = await Order.count({ where: { status: 'delivered' } });
        const cancelledOrders = await Order.count({ where: { status: 'cancelled' } });
        
        // Get total revenue
        const orders = await Order.findAll({
            where: {
                status: {
                    [Op.ne]: 'cancelled'
                }
            },
            attributes: ['total_amount']
        });
        
        const totalRevenue = orders.reduce((total, order) => {
            return total + Number(order.total_amount);
        }, 0);
        
        return res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue
            }
        });
    } catch (error) {
        console.error('Error retrieving order statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve order statistics',
            error: error.message
        });
    }
};
