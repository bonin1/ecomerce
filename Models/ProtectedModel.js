const Sequelize = require('sequelize');
const db2 = require('../db2');
require('dotenv').config()

module.exports = db2.define('produktet', {
    emri_produktit: {
        type: Sequelize.STRING,
        allowNull: false
    },
    pershkrimi_produktit: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    cmimi_produktit: {
        type: Sequelize.STRING,
        allowNull: false
    },
    origjina_produktit: {
        type: Sequelize.STRING,
        allowNull: false
    },
    sasia_produktit: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    kategoria: {
        type: Sequelize.STRING,
        allowNull: true
    },
    foto_produktit: {
        type: Sequelize.STRING,
        allowNull: false
    },
}, {
    timestamps: false,
    tableName: 'produktet'
});
