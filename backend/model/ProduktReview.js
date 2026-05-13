const { DataTypes } = require('sequelize');
const db = require('../database');
const User = require('./UserModel');
const Produkt = require('./ProduktModel');

const ProduktReview = db.define('produkt_review', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
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
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    verified_purchase: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    }
}, {
    timestamps: true,
    freezeTableName: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'product_id'],
            name: 'user_product_review_unique'
        }
    ]
});

// Add these associations
ProduktReview.belongsTo(User, { foreignKey: 'user_id' });
ProduktReview.belongsTo(Produkt, { foreignKey: 'product_id' });
User.hasMany(ProduktReview, { foreignKey: 'user_id' });
Produkt.hasMany(ProduktReview, { foreignKey: 'product_id' });

module.exports = ProduktReview;
