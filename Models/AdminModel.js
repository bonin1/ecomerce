const { Sequelize, literal } = require('sequelize');
const db2 = require('../db2');



const AdminInformation = db2.define('admin_information', {
    admin_email: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    timestamps: false,
    freezeTableName: true,
    tableName: 'admin_information',
    underscored: true
});

db2.sync()

module.exports = AdminInformation