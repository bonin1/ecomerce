const { DataTypes } = require('sequelize');
const db = require('../database');

const User = db.define('users', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    device:{
        type: DataTypes.STRING,
        allowNull: true
    },
    role:{
        type: DataTypes.ENUM('admin', 'user', 'staff', 'superadmin', 'moderator', 'guest', 'banned'),
        allowNull: true
    },
    phone_number:{
        type: DataTypes.STRING,
        allowNull: true
    },
    address:{
        type: DataTypes.STRING,
        allowNull: true
    },
    city:{
        type: DataTypes.STRING,
        allowNull: true
    },
    two_factor_secret: {
        type: DataTypes.STRING,
        allowNull: true
    },
    two_factor_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    last_login_ip: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last_login_device: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    account_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, 
        allowNull: false
    },
    marked_for_deletion: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    deletion_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    passwordResetToken: {
        type: DataTypes.STRING,
        defaultValue: null
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    lastEmailSentAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    verificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    verificationExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otpExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    trustedDevices: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('trustedDevices');
            return value ? JSON.parse(value) : [];
        },
        set(value) {
            this.setDataValue('trustedDevices', JSON.stringify(value));
        }
    }
}, {
    timestamps: true,
    freezeTableName: true,
});

module.exports = User;