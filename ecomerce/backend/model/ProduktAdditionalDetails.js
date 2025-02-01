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
        type: DataTypes.STRING,
        allowNull: false
    },
    product_size: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_weight: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_dimensions: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_material: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_manufacturer: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_origin: {
        type: DataTypes.STRING,
        allowNull: false
    },

});

module.exports = ProduktAdditionalDetails;