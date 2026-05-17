const { DataTypes } = require('sequelize');
const db = require('../database');

const ContentFlag = db.define(
    'content_flag',
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        entity_type: { type: DataTypes.STRING(64), allowNull: false },
        entity_id: { type: DataTypes.BIGINT, allowNull: false },
        reason: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.ENUM('open', 'resolved', 'dismissed'),
            allowNull: false,
            defaultValue: 'open',
        },
        reporter_id: { type: DataTypes.BIGINT, allowNull: true },
        resolver_id: { type: DataTypes.BIGINT, allowNull: true },
    },
    {
        freezeTableName: true,
        tableName: 'content_flags',
        timestamps: true,
    }
);

module.exports = ContentFlag;
