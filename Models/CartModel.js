const { Sequelize, literal } = require('sequelize');
const db2 = require('../db2'); 
const Produkti = require('./ProductIdModel')

const Cart = db2.define('Cart', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    produkt_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
            model: 'produktet', 
            key: 'id'
        }
    },
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'cart',
    timestamps: false 
});

Cart.belongsTo(Produkti, { foreignKey: 'produkt_id' });

module.exports = Cart;