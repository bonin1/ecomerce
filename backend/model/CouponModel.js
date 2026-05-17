const { DataTypes } = require('sequelize');
const db = require('../database');

const Coupon = db.define(
    'coupon',
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        discount_type: { type: DataTypes.ENUM('percent', 'fixed'), allowNull: false },
        discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        max_uses: { type: DataTypes.INTEGER, allowNull: true },
        used_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        starts_at: { type: DataTypes.DATE, allowNull: true },
        ends_at: { type: DataTypes.DATE, allowNull: true },
        product_ids: { type: DataTypes.JSON, allowNull: true },
        category_ids: { type: DataTypes.JSON, allowNull: true },
        stackable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
        freezeTableName: true,
        tableName: 'coupons',
        timestamps: true,
    }
);

module.exports = Coupon;
