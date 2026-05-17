const { DataTypes } = require('sequelize');
const db = require('../database');
const Produkt = require('./ProduktModel');

const ProductCostSheet = db.define(
    'product_cost_sheet',
    {
        product_id: { type: DataTypes.BIGINT, primaryKey: true },
        cost_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        supplier_po: { type: DataTypes.STRING(160), allowNull: true },
    },
    {
        freezeTableName: true,
        tableName: 'product_cost_sheets',
        timestamps: true,
    }
);

ProductCostSheet.belongsTo(Produkt, { foreignKey: 'product_id' });
Produkt.hasOne(ProductCostSheet, { foreignKey: 'product_id', as: 'cost_sheet' });

module.exports = ProductCostSheet;
