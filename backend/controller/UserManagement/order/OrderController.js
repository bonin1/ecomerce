const Order = require('../../../model/OrderModel');
const OrderItem = require('../../../model/OrderItemModel');
const Product = require('../../../model/ProduktModel');
const User = require('../../../model/UserModel');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const db = require('../../../database');
const emailService = require('../../../services/emailServices');

const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
};

exports.createOrder = async (req, res) => {
    const transaction = await db.transaction();

    try {
        const { 
            items,
            shippingAddress,
            shippingCity,
            shippingPostalCode,
            shippingCountry,
            contactPhone,
            contactEmail,
            paymentMethod,
            notes
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'No items provided' });
        }

        let totalAmount = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = await Product.findByPk(item.id);
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ message: `Product with ID ${item.id} not found` });
            }

            if (product.product_stock < item.quantity) {
                await transaction.rollback();
                return res.status(400).json({ 
                    message: `Not enough stock for product ${product.product_name}. Available: ${product.product_stock}` 
                });
            }

            const price = product.product_discount_active ? 
                Number(product.product_discount_price) : 
                Number(product.product_price);

            const itemTotal = price * item.quantity;
            totalAmount += itemTotal;

            validatedItems.push({
                product_id: product.id,
                product_name: product.product_name,
                price,
                quantity: item.quantity,
                total_price: itemTotal
            });

            await product.update({
                product_stock: product.product_stock - item.quantity
            }, { transaction });
        }

        const order = await Order.create({
            user_id: req.user.id,
            order_number: generateOrderNumber(),
            total_amount: totalAmount,
            shipping_address: shippingAddress,
            shipping_city: shippingCity,
            shipping_postal_code: shippingPostalCode,
            shipping_country: shippingCountry,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            payment_method: paymentMethod,
            notes,
            status: 'pending',
            payment_status: 'pending'
        }, { transaction });

        for (const item of validatedItems) {
            await OrderItem.create({
                order_id: order.id,
                ...item
            }, { transaction });
        }

        // After successfully creating the order and committing the transaction
        await transaction.commit();

        try {
            // Fetch the complete order with items to send in email
            const completeOrder = await Order.findByPk(order.id, {
                include: [
                    {
                        model: OrderItem,
                        as: 'items'
                    }
                ]
            });

            // Send order confirmation email
            await emailService.sendOrderConfirmationEmail(contactEmail, completeOrder);
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't return an error to the client, just log it
        }

        return res.status(201).json({
            message: 'Order created successfully',
            order: {
                id: order.id,
                order_number: order.order_number,
                total_amount: order.total_amount,
                status: order.status,
                createdAt: order.createdAt
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating order:', error);
        return res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const orders = await Order.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: OrderItem,
                    as: 'items'
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Error retrieving orders:', error);
        return res.status(500).json({ message: 'Failed to retrieve orders', error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        
        const order = await Order.findOne({
            where: { 
                id: orderId,
                user_id: userId 
            },
            include: [
                {
                    model: OrderItem,
                    as: 'items'
                }
            ]
        });
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        return res.status(200).json(order);
    } catch (error) {
        console.error('Error retrieving order:', error);
        return res.status(500).json({ message: 'Failed to retrieve order', error: error.message });
    }
};

exports.cancelOrder = async (req, res) => {
    const transaction = await db.transaction();
    
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        
        const order = await Order.findOne({
            where: { 
                id: orderId,
                user_id: userId 
            },
            include: [
                {
                    model: OrderItem,
                    as: 'items'
                }
            ],
            transaction
        });
        
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (order.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ message: 'Only pending orders can be canceled' });
        }
        
        for (const item of order.items) {
            const product = await Product.findByPk(item.product_id, { transaction });
            if (product) {
                await product.update({
                    product_stock: product.product_stock + item.quantity
                }, { transaction });
            }
        }
        
        await order.update({
            status: 'cancelled',
            payment_status: 'refunded' 
        }, { transaction });
        
        await transaction.commit();
        
        return res.status(200).json({ 
            message: 'Order cancelled successfully',
            order: {
                id: order.id,
                status: 'cancelled'
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error cancelling order:', error);
        return res.status(500).json({ message: 'Failed to cancel order', error: error.message });
    }
};
