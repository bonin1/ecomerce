const { DataTypes } = require('sequelize');
const db = require('../database');
const User = require('./UserModel');

const AdminUserNote = db.define(
    'admin_user_note',
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        target_user_id: { type: DataTypes.BIGINT, allowNull: false },
        author_user_id: { type: DataTypes.BIGINT, allowNull: false },
        body: { type: DataTypes.TEXT, allowNull: false },
    },
    {
        freezeTableName: true,
        tableName: 'admin_user_notes',
        timestamps: true,
        updatedAt: false,
    }
);

AdminUserNote.belongsTo(User, { foreignKey: 'target_user_id', as: 'target' });
AdminUserNote.belongsTo(User, { foreignKey: 'author_user_id', as: 'author' });

module.exports = AdminUserNote;
