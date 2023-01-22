const { Sequelize, literal } = require('sequelize');
const db2 = require('../db2');


const Home = db2.define('produktet', {
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
    kategoria: {
        type: Sequelize.STRING,
        allowNull: true
    },
    foto_produktit: {
        type: Sequelize.TEXT,
        allowNull: false
    },
}, {
    timestamps: false,
    freezeTableName: true,
    tableName: 'produktet',
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['id']
        }
    ]
});

module.exports = Home;
