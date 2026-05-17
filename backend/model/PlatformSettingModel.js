const { DataTypes } = require('sequelize');
const db = require('../database');

const PlatformSetting = db.define(
    'platform_setting',
    {
        key: { type: DataTypes.STRING(120), primaryKey: true },
        value: { type: DataTypes.JSON, allowNull: true },
        updated_by: { type: DataTypes.BIGINT, allowNull: true },
    },
    {
        freezeTableName: true,
        tableName: 'platform_settings',
        timestamps: true,
    }
);

module.exports = PlatformSetting;
