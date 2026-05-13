const { DataTypes } = require('sequelize');
const db = require('../database');
const ProduktCategory = require('./ProductCategoryModel');

const Produkt = db.define('produkt', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    product_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    product_primary_image: {
        type: DataTypes.STRING(255), 
        allowNull: true 
    },
    product_description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    product_price: {
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false
    },
    product_image: {
        type: DataTypes.STRING(255),
        allowNull: true 
    },
    product_brand: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    product_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    product_rating: {
        type: DataTypes.DECIMAL(3, 2), 
        allowNull: true,  
        defaultValue: 0
    },
    product_discount: {
        type: DataTypes.BOOLEAN, 
        allowNull: true
    },
    product_discount_price: {
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: true 
    },
    product_discount_start: {
        type: DataTypes.DATE,
        allowNull: true 
    },
    product_discount_end: {
        type: DataTypes.DATE,
        allowNull: true
    },
    product_discount_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    product_discount_percentage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    product_discount_code: {
        type: DataTypes.STRING(50),
        allowNull: true 
    },
    warranty: {
        type: DataTypes.STRING(100),
        allowNull: true  
    },
    product_category_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: ProduktCategory,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
}, {
    timestamps: true,
    freezeTableName: true,
});

module.exports = Produkt;
