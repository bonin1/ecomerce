const { DataTypes } = require('sequelize');
const db = require('../database');
const Produkt = require('./ProduktModel');

const ProduktAdditionalDetails = db.define('produkt_additional_details', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Produkt,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    product_color: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    product_size: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    product_weight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    product_dimensions: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    product_material: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    product_manufacturer: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    product_origin: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    timestamps: true,
    freezeTableName: true
});

module.exports = ProduktAdditionalDetails;