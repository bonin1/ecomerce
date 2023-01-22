const { Sequelize, literal } = require('sequelize');
const db2 = require('../db2');


const LoginInformation = db2.define('login_information', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    emri: {
        type: Sequelize.STRING,
        allowNull: false
    },
    mbiemri: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    oldpassword: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    timestamps: false,
    freezeTableName: true,
    tableName: 'login_information',
    underscored: true
});


module.exports = LoginInformation;