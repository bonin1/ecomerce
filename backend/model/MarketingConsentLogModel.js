const { DataTypes } = require('sequelize');
const db = require('../database');

const MarketingConsentLog = db.define(
    'marketing_consent_log',
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.BIGINT, allowNull: true },
        channel: { type: DataTypes.STRING(64), allowNull: false },
        opted_in: { type: DataTypes.BOOLEAN, allowNull: false },
        ip: { type: DataTypes.STRING(64), allowNull: true },
        metadata: { type: DataTypes.JSON, allowNull: true },
    },
    {
        freezeTableName: true,
        tableName: 'marketing_consent_logs',
        timestamps: true,
    }
);

module.exports = MarketingConsentLog;
