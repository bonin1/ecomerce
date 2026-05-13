const { DataTypes } = require('sequelize');
const db = require('../database');
const Order = require('./OrderModel');

const OrderTracking = db.define('order_tracking', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Order,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    status: {
        type: DataTypes.ENUM('order_placed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned', 'cancelled'),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Current location of the package'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional details about the tracking update'
    },
    carrier: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Shipping carrier name'
    },
    carrier_tracking_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Tracking number provided by the carrier'
    },
    estimated_delivery: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updated_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'ID of the admin who updated this tracking status'
    },
    is_customer_notified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the customer has been notified of this tracking update'
    }
}, {
    timestamps: true,
    freezeTableName: true
});

OrderTracking.belongsTo(Order, { foreignKey: 'order_id' });
Order.hasMany(OrderTracking, { foreignKey: 'order_id', as: 'tracking_history' });

module.exports = OrderTracking;