const { DataTypes } = require('sequelize');
const db = require('../database');
const Order = require('./OrderModel');
const User = require('./UserModel');

const ReturnRequest = db.define(
    'return_request',
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        order_id: { type: DataTypes.BIGINT, allowNull: false },
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        status: {
            type: DataTypes.ENUM('requested', 'approved', 'rejected', 'received', 'refunded', 'store_credit'),
            allowNull: false,
            defaultValue: 'requested',
        },
        reason: { type: DataTypes.TEXT, allowNull: true },
        restock_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
        refund_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        label_url: { type: DataTypes.STRING(500), allowNull: true },
        admin_notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
        freezeTableName: true,
        tableName: 'return_requests',
        timestamps: true,
    }
);

ReturnRequest.belongsTo(Order, { foreignKey: 'order_id' });
ReturnRequest.belongsTo(User, { foreignKey: 'user_id' });

module.exports = ReturnRequest;
