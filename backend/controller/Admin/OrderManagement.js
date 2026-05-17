const Order = require('../../model/OrderModel');
const OrderItem = require('../../model/OrderItemModel');
const User = require('../../model/UserModel');
const Product = require('../../model/ProduktModel');
const PlatformSetting = require('../../model/PlatformSettingModel');
const { Op } = require('sequelize');
const db = require('../../database');
const { logAdminActivity } = require('../../utils/logAdminActivity');

exports.getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;
        const date_from = req.query.date_from;
        const date_to = req.query.date_to;
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order || 'DESC';
        
        const whereClause = {};

        if (date_from) {
            const df = new Date(String(date_from));
            if (!Number.isNaN(df.getTime())) {
                whereClause.createdAt = { ...(whereClause.createdAt || {}), [Op.gte]: df };
            }
        }
        if (date_to) {
            const dt = new Date(String(date_to));
            if (!Number.isNaN(dt.getTime())) {
                dt.setHours(23, 59, 59, 999);
                whereClause.createdAt = { ...(whereClause.createdAt || {}), [Op.lte]: dt };
            }
        }
        
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

        const statusRows = await Order.findAll({
            attributes: ['status', [db.fn('COUNT', db.col(`${Order.tableName}.id`)), 'count']],
            group: ['status'],
            raw: true
        });
        const statusCounts = {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        };
        for (const row of statusRows) {
            if (row.status && Object.prototype.hasOwnProperty.call(statusCounts, row.status)) {
                statusCounts[row.status] = parseInt(row.count, 10) || 0;
            }
        }
        
        return res.status(200).json({
            success: true,
            data: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                orders,
                statusCounts
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

exports.updateOrderStatus = async (req, res) => {
    const transaction = await db.transaction();
    
    try {
        const { orderId } = req.params;
        const { status, payment_status, tracking_number, estimated_delivery_date } = req.body;
        
        const order = await Order.findByPk(orderId, { 
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'phone_number']
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
        
        const updateData = {};
        
        if (status) updateData.status = status;
        if (payment_status) updateData.payment_status = payment_status;
        if (tracking_number) updateData.tracking_number = tracking_number;
        if (estimated_delivery_date) updateData.estimated_delivery_date = estimated_delivery_date;

        const prevStatus = order.status;
        if (status === 'processing' && prevStatus !== 'processing') {
            try {
                const rRow = await PlatformSetting.findByPk('order_sla_respond_hours');
                const sRow = await PlatformSetting.findByPk('order_sla_ship_hours');
                const respondH = Math.max(1, parseInt(rRow?.value ?? 24, 10) || 24);
                const shipH = Math.max(1, parseInt(sRow?.value ?? 72, 10) || 72);
                const now = Date.now();
                updateData.respond_by = new Date(now + respondH * 3600 * 1000);
                updateData.ship_by = new Date(now + shipH * 3600 * 1000);
            } catch {
                /* ignore SLA if settings unavailable */
            }
        }

        await order.update(updateData, { transaction });
        
        if (status === 'cancelled' && order.previous('status') !== 'cancelled') {
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

        await logAdminActivity(req, {
            action: 'admin.order.status_update',
            entity_type: 'order',
            entity_id: Number(orderId),
            metadata: {
                prevStatus,
                updateData,
            },
        });

        const updatedOrder = await Order.findByPk(orderId, {
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

exports.getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.count();
        const pendingOrders = await Order.count({ where: { status: 'pending' } });
        const processingOrders = await Order.count({ where: { status: 'processing' } });
        const shippedOrders = await Order.count({ where: { status: 'shipped' } });
        const deliveredOrders = await Order.count({ where: { status: 'delivered' } });
        const cancelledOrders = await Order.count({ where: { status: 'cancelled' } });
        
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
