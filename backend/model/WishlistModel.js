const { DataTypes } = require('sequelize');
const db = require('../database');
const Produkt = require('./ProduktModel');

const WishlistItem = db.define(
    'wishlist_items',
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    },
    {
        timestamps: true,
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'product_id'],
                name: 'wishlist_user_product_unique',
            },
        ],
    }
);

WishlistItem.belongsTo(Produkt, { foreignKey: 'product_id', as: 'product' });

module.exports = WishlistItem;
