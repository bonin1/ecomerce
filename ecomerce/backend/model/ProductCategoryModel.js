const { DataTypes } = require('sequelize');
const db = require('../database');


const ProductCategory = db.define('product_category', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    product_category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
});

module.exports = ProductCategory;