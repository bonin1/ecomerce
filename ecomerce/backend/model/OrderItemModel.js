const { DataTypes } = require('sequelize');
const db = require('../database');
const Order = require('./OrderModel');
const Produkt = require('./ProduktModel');

const OrderItem = db.define('order_item', {
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
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Produkt,
            key: 'id'
        }
    },
    product_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    timestamps: true,
    freezeTableName: true
});

OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });

OrderItem.belongsTo(Produkt, { foreignKey: 'product_id' });
Produkt.hasMany(OrderItem, { foreignKey: 'product_id' });

module.exports = OrderItem;
