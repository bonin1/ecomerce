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
        type: DataTypes.STRING,
        allowNull: false
    },
    product_primary_image: {
        type: DataTypes.BLOB('long'),
        allowNull: false
    },
    product_description: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    product_price: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_image: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_brand: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_stock: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_rating: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_discount: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_discount_price: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_discount_start: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_discount_end: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_discount_active: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_discount_percentage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_discount_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    warranty: {
        type: DataTypes.STRING,
        allowNull: false
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
