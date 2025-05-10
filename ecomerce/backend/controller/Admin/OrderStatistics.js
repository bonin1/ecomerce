const Order = require('../../model/OrderModel');
const OrderItem = require('../../model/OrderItemModel');
const Product = require('../../model/ProduktModel');
const User = require('../../model/UserModel');
const { Op, Sequelize } = require('sequelize');
const { subDays, subMonths, startOfMonth, endOfMonth, format } = require('date-fns');

exports.getAdvancedOrderStats = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);
        const ninetyDaysAgo = subDays(now, 90);
        const sixMonthsAgo = subMonths(now, 6);
        
        const dailyOrders = await Order.findAll({
            where: {
                createdAt: {
                    [Op.gte]: thirtyDaysAgo,
                    [Op.lte]: now
                }
            },
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m-%d'), 'date'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'revenue']
            ],
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m-%d')],
            raw: true
        });

        const ordersByStatus = await Order.findAll({
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });
        
        const monthlyRevenue = [];
        for (let i = 0; i < 6; i++) {
            const date = subMonths(now, i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            
            const result = await Order.findOne({
                where: {
                    createdAt: {
                        [Op.between]: [monthStart, monthEnd]
                    },
                    status: {
                        [Op.ne]: 'cancelled'
                    }
                },
                attributes: [
                    [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'revenue'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
                ],
                raw: true
            });
            
            monthlyRevenue.unshift({
                month: format(date, 'MMM yyyy'),
                revenue: result.revenue ? parseFloat(result.revenue) : 0,
                count: result.count ? parseInt(result.count) : 0
            });
        }

        const topProducts = await OrderItem.findAll({
            attributes: [
                'product_id',
                'product_name',
                [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_quantity'],
                [Sequelize.fn('SUM', Sequelize.col('total_price')), 'total_revenue']
            ],
            include: [
                {
                    model: Order,
                    attributes: [],
                    where: {
                        createdAt: {
                            [Op.gte]: ninetyDaysAgo
                        },
                        status: {
                            [Op.ne]: 'cancelled'
                        }
                    }
                },
                {
                    model: Product,
                    attributes: ['product_primary_image']
                }
            ],
            group: ['product_id', 'product_name'],
            order: [[Sequelize.fn('SUM', Sequelize.col('quantity')), 'DESC']],
            limit: 10,
            raw: true
        });

        const averageOrderValue = await Order.findAll({
            where: {
                createdAt: {
                    [Op.gte]: sixMonthsAgo
                },
                status: {
                    [Op.ne]: 'cancelled'
                }
            },
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'month'],
                [Sequelize.fn('AVG', Sequelize.col('total_amount')), 'average']
            ],
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')],
            order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
            raw: true
        });

        const repeatCustomerStats = await Order.findAll({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('user_id'))), 'total_customers'],
                [Sequelize.literal('COUNT(id) / COUNT(DISTINCT user_id)'), 'orders_per_customer']
            ],
            where: {
                createdAt: {
                    [Op.gte]: ninetyDaysAgo
                }
            },
            raw: true
        });

        const paymentMethodStats = await Order.findAll({
            attributes: [
                'payment_method',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total']
            ],
            group: ['payment_method'],
            raw: true
        });

        res.json({
            success: true,
            data: {
                dailyOrders: formatTimeSeriesData(dailyOrders, 30, 'date', 'count', 'revenue'),
                ordersByStatus,
                monthlyRevenue,
                topProducts,
                averageOrderValue,
                customerStats: {
                    totalCustomers: parseInt(repeatCustomerStats[0].total_customers),
                    ordersPerCustomer: parseFloat(repeatCustomerStats[0].orders_per_customer).toFixed(2)
                },
                paymentMethodStats
            }
        });
    } catch (error) {
        console.error('Advanced Order Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching advanced order statistics',
            error: error.message
        });
    }
};

function formatTimeSeriesData(data, days, dateField, countField, revenueField) {
    const now = new Date();
    const result = [];
    
    const dataMap = data.reduce((acc, item) => {
        acc[item[dateField]] = {
            count: parseInt(item[countField] || 0),
            revenue: parseFloat(item[revenueField] || 0)
        };
        return acc;
    }, {});
    
    for (let i = days - 1; i >= 0; i--) {
        const date = format(subDays(now, i), 'yyyy-MM-dd');
        const existingData = dataMap[date] || { count: 0, revenue: 0 };
        
        result.push({
            date,
            count: existingData.count,
            revenue: existingData.revenue
        });
    }
    
    return result;
}

exports.getOrderFulfillmentStats = async (req, res) => {
    try {
        const now = new Date();
        const sixMonthsAgo = subMonths(now, 6);
        
        const processingTimeStats = await Order.findAll({
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'month'],
                [
                    Sequelize.fn(
                        'AVG', 
                        Sequelize.literal('TIMESTAMPDIFF(HOUR, createdAt, updatedAt)')
                    ), 
                    'processing_hours'
                ]
            ],
            where: {
                status: {
                    [Op.in]: ['shipped', 'delivered']
                },
                createdAt: {
                    [Op.gte]: sixMonthsAgo
                }
            },
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')],
            order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
            raw: true
        });

        const totalOrdersShipped = await Order.count({
            where: {
                status: {
                    [Op.in]: ['shipped', 'delivered']
                },
                createdAt: {
                    [Op.gte]: sixMonthsAgo
                }
            }
        });
        
        const fastProcessingOrders = await Order.count({
            where: {
                status: {
                    [Op.in]: ['shipped', 'delivered']
                },
                createdAt: {
                    [Op.gte]: sixMonthsAgo
                },
                [Op.and]: [
                    Sequelize.literal('TIMESTAMPDIFF(HOUR, createdAt, updatedAt) < 24')
                ]
            }
        });
        
        const fulfillmentRate = totalOrdersShipped > 0 
            ? (fastProcessingOrders / totalOrdersShipped * 100).toFixed(2) 
            : 0;

        res.json({
            success: true,
            data: {
                processingTimeStats,
                fulfillmentStats: {
                    totalOrdersShipped,
                    fastProcessingOrders,
                    fulfillmentRate
                }
            }
        });
    } catch (error) {
        console.error('Order Fulfillment Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order fulfillment statistics',
            error: error.message
        });
    }
};

exports.getCustomerOrderInsights = async (req, res) => {
    try {
        const now = new Date();
        const sixMonthsAgo = subMonths(now, 6);
        
        const newCustomers = await User.count({
            where: {
                createdAt: {
                    [Op.gte]: sixMonthsAgo
                }
            }
        });
        
        const ordersByCustomerType = await Order.findAll({
            attributes: [
                [
                    Sequelize.literal(`
                        CASE 
                            WHEN DATEDIFF(order.createdAt, user.createdAt) <= 30 
                            THEN 'new' 
                            ELSE 'returning' 
                        END
                    `),
                    'customer_type'
                ],
                [Sequelize.fn('COUNT', Sequelize.col('order.id')), 'order_count'],
                [Sequelize.fn('SUM', Sequelize.col('order.total_amount')), 'total_revenue']
            ],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: []
                }
            ],
            where: {
                createdAt: {
                    [Op.gte]: sixMonthsAgo
                }
            },
            group: [
                Sequelize.literal(`
                    CASE 
                        WHEN DATEDIFF(order.createdAt, user.createdAt) <= 30 
                        THEN 'new' 
                        ELSE 'returning' 
                    END
                `)
            ],
            raw: true
        });
        
        const topCustomers = await Order.findAll({
            attributes: [
                'user_id',
                [Sequelize.fn('COUNT', Sequelize.col('order.id')), 'order_count'],
                [Sequelize.fn('SUM', Sequelize.col('order.total_amount')), 'total_spent']
            ],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'email']
                }
            ],
            where: {
                createdAt: {
                    [Op.gte]: sixMonthsAgo
                },
                status: {
                    [Op.ne]: 'cancelled'
                }
            },
            group: ['user_id'],
            order: [[Sequelize.fn('SUM', Sequelize.col('order.total_amount')), 'DESC']],
            limit: 10
        });
        
        res.json({
            success: true,
            data: {
                newCustomers,
                ordersByCustomerType,
                topCustomers
            }
        });
    } catch (error) {
        console.error('Customer Order Insights Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer order insights',
            error: error.message
        });
    }
};
