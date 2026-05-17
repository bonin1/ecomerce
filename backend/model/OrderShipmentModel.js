const { DataTypes } = require('sequelize');
const db = require('../database');
const Order = require('./OrderModel');

const OrderShipment = db.define(
    'order_shipment',
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        order_id: { type: DataTypes.BIGINT, allowNull: false },
        tracking_number: { type: DataTypes.STRING(160), allowNull: false },
        carrier: { type: DataTypes.STRING(120), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        /** Optional JSON: [{ product_id, quantity }] for partial fulfillments */
        line_items: { type: DataTypes.JSON, allowNull: true },
    },
    {
        freezeTableName: true,
        tableName: 'order_shipments',
        timestamps: true,
    }
);

OrderShipment.belongsTo(Order, { foreignKey: 'order_id' });
Order.hasMany(OrderShipment, { foreignKey: 'order_id', as: 'shipments' });

module.exports = OrderShipment;
