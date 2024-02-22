const { Sequelize, literal } = require('sequelize');
const db2 = require('../db2'); 

const Produkti = db2.define('produktet', {
    emri_produktit: {
        type: Sequelize.STRING,
        allowNull: false
    },
    company_name: {
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
    garancioni: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    serialcode: {
        type: Sequelize.STRING,
        allowNull: true
    },
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
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

module.exports = Produkti;
