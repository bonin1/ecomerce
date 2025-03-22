const { DataTypes } = require('sequelize');
const db = require('../database');
const CareersModel = require('./CareersModel');

const CareerApplicationModel = db.define('career_application', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    career_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: CareersModel,
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    resume: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    cover_letter: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    timestamps: true,
    freezeTableName: true
});

CareerApplicationModel.belongsTo(CareersModel, {
    foreignKey: 'career_id',
    as: 'career'
});

module.exports = CareerApplicationModel;