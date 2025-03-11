const { DataTypes } = require('sequelize');
const db = require('../database');

const PaymentMethod = db.define('PaymentMethod', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    icon: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    processing_time: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    fee_percentage: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fee_fixed: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    min_amount: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    max_amount: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 999
    }
});

module.exports = PaymentMethod;
