const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Subscribe = sequelize.define('Subscribe', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
        isEmail: true
        }
    },
    unsubscribeToken: {
        type: DataTypes.STRING(64),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    subscribedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    unsubscribedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Subscribe;
