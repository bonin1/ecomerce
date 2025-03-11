const { DataTypes } = require('sequelize');
const db = require('../database');
const Produkt = require('./ProduktModel');
const PaymentMethod = require('./PaymentMethodsModel');

const ProductPaymentMethod = db.define('ProductPaymentMethod', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Produkt,
            key: 'id'
        }
    },
    payment_method_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: PaymentMethod,
            key: 'id'
        }
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['product_id', 'payment_method_id']
        }
    ]
});

// Remove current associations first
// Define associations in a way that makes them accessible
Produkt.belongsToMany(PaymentMethod, { 
    through: ProductPaymentMethod,
    foreignKey: 'product_id',
    otherKey: 'payment_method_id',
    as: 'paymentMethods'
});

PaymentMethod.belongsToMany(Produkt, {
    through: ProductPaymentMethod,
    foreignKey: 'payment_method_id',
    otherKey: 'product_id',
    as: 'products'
});

// Add direct associations between junction model and its components
ProductPaymentMethod.belongsTo(Produkt, { foreignKey: 'product_id' });
ProductPaymentMethod.belongsTo(PaymentMethod, { foreignKey: 'payment_method_id' });
Produkt.hasMany(ProductPaymentMethod, { foreignKey: 'product_id' });
PaymentMethod.hasMany(ProductPaymentMethod, { foreignKey: 'payment_method_id' });

module.exports = ProductPaymentMethod;
