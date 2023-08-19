const { Sequelize } = require('sequelize');
const db2 = require('../db2');
const Produkti = require('./ProductIdModel');

const ProduktImages = db2.define('produktimages', {
    produkt_id: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    foto_produktit: {
        type: Sequelize.BLOB,
        allowNull: false
    },
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
}, {
    timestamps: false,
    freezeTableName: true,
    tableName: 'produktimages',
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['id']
        }
    ]
});


ProduktImages.belongsTo(Produkti, { foreignKey: 'produkt_id' });

module.exports = ProduktImages;
