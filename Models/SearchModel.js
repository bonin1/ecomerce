const { Sequelize, literal } = require('sequelize');
const db2 = require('../db2');

const Search = db2.define('Product', {
    emri_produktit: {
        type: Sequelize.STRING,
        allowNull: false
    },
    pershkrimi_produktit: {
        type: Sequelize.STRING,
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
        type: Sequelize.STRING
    },
    foto_produktit: {
        type: Sequelize.STRING,
        allowNull: false
    },
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    }
}, {
    timestamps: false,
    freezeTableName: true,
    tableName: 'produktet',
    underscored: true
}

);


db2.sync();

module.exports = Search;
