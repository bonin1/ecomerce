const { DataTypes } = require('sequelize');
const db = require('../database');

/** Immutable admin audit trail (separate from audit_log staff change-requests). */
const AdminActivityLog = db.define(
    'admin_activity_log',
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        actor_user_id: { type: DataTypes.BIGINT, allowNull: true },
        actor_role: { type: DataTypes.STRING(32), allowNull: true },
        action: { type: DataTypes.STRING(160), allowNull: false },
        entity_type: { type: DataTypes.STRING(80), allowNull: false },
        entity_id: { type: DataTypes.BIGINT, allowNull: true },
        metadata: { type: DataTypes.JSON, allowNull: true },
        ip: { type: DataTypes.STRING(64), allowNull: true },
    },
    {
        freezeTableName: true,
        tableName: 'admin_activity_logs',
        timestamps: true,
        updatedAt: false,
    }
);

module.exports = AdminActivityLog;
