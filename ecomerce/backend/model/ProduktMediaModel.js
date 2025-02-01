const { DataTypes } = require('sequelize');
const db = require('../database');
const Produkt = require('./ProduktModel');


const ProduktMedia = db.define('produkt_media', { 
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
    media: {
        type: DataTypes.BLOB('long'),
        allowNull: false
    },
    media_type: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = ProduktMedia;
