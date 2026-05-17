const { DataTypes } = require('sequelize');
const db = require('../database');
const Order = require('./OrderModel');

const AdminOrderNote = db.define(
    'admin_order_note',
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        order_id: { type: DataTypes.BIGINT, allowNull: false },
        author_user_id: { type: DataTypes.BIGINT, allowNull: false },
        body: { type: DataTypes.TEXT, allowNull: false },
    },
    {
        freezeTableName: true,
        tableName: 'admin_order_notes',
        timestamps: true,
        updatedAt: false,
    }
);

AdminOrderNote.belongsTo(Order, { foreignKey: 'order_id' });
Order.hasMany(AdminOrderNote, { foreignKey: 'order_id', as: 'admin_notes' });

module.exports = AdminOrderNote;
