const { DataTypes } = require('sequelize');
const db = require('../database');

const Affiliate = db.define('Affiliate', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Full name is required'
            },
            len: {
                args: [2, 100],
                msg: 'Full name must be between 2 and 100 characters'
            }
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: {
                msg: 'Please provide a valid email address'
            }
        }
    },
    website: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            isUrl: {
                msg: 'Please provide a valid website URL'
            }
        }
    },
    socialMedia: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
        defaultValue: 'pending',
        allowNull: false
    },
    affiliateCode: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: true // Will be generated upon approval
    },
    commissionRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 10.00,
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        }
    },
    totalEarnings: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false
    },
    totalClicks: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    totalConversions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.ENUM('paypal', 'bank_transfer', 'cryptocurrency'),
        allowNull: true
    },
    paymentDetails: {
        type: DataTypes.JSON,
        allowNull: true
    },
    lastPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'affiliates',
    timestamps: true,
    indexes: [
        {
            fields: ['email']
        },
        {
            fields: ['affiliateCode']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = Affiliate;
