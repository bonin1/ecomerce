const { DataTypes } = require('sequelize');
const db = require('../database');
const Order = require('./OrderModel');

const OrderRiskFlag = db.define(
    'order_risk_flag',
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        order_id: { type: DataTypes.BIGINT, allowNull: false },
        score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        reasons: { type: DataTypes.JSON, allowNull: true },
        status: {
            type: DataTypes.ENUM('open', 'cleared', 'escalated'),
            allowNull: false,
            defaultValue: 'open',
        },
        chargeback_note: { type: DataTypes.TEXT, allowNull: true },
    },
    {
        freezeTableName: true,
        tableName: 'order_risk_flags',
        timestamps: true,
    }
);

OrderRiskFlag.belongsTo(Order, { foreignKey: 'order_id', as: 'orderRecord' });
Order.hasMany(OrderRiskFlag, { foreignKey: 'order_id', as: 'risk_flags' });

module.exports = OrderRiskFlag;
