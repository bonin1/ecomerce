const { DataTypes } = require('sequelize');
const db = require('../database');

const AffiliateClick = db.define('AffiliateClick', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    affiliateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'affiliates',
            key: 'id'
        }
    },
    affiliateCode: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    productId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'produkt',
            key: 'id'
        }
    },
    visitorIp: {
        type: DataTypes.STRING(45),
        allowNull: false
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    referrerUrl: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    landingPage: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    sessionId: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    isConverted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    orderId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'order',
            key: 'id'
        }
    },
    commissionAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    conversionDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'affiliate_clicks',
    timestamps: true,
    indexes: [
        {
            fields: ['affiliateId']
        },
        {
            fields: ['affiliateCode']
        },
        {
            fields: ['productId']
        },
        {
            fields: ['sessionId']
        },
        {
            fields: ['isConverted']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = AffiliateClick;
