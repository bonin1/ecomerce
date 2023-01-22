const { Sequelize, literal } = require('sequelize');
const db2 = require('../db2');


const Review = db2.define('reviews', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: Sequelize.BIGINT,
        references: {
            model: 'produktet',
            key: 'id'
        },
        allowNull: false
    },
    user_id: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    rating: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    comment: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
}, {
    timestamps: false,
    freezeTableName: true,
    tableName: 'reviews',
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['id']
        }
    ]
});
module.exports = Review;