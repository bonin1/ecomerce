const { DataTypes } = require('sequelize');
const db = require('../database');
const ProduktReview = require('./ProduktReview');

const ReviewMedia = db.define('review_media', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    review_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: ProduktReview,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    media: {
        type: DataTypes.BLOB('long'),
        allowNull: false
    },
    media_type: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true,
    freezeTableName: true
});

ProduktReview.hasMany(ReviewMedia, { foreignKey: 'review_id', as: 'media' });
ReviewMedia.belongsTo(ProduktReview, { foreignKey: 'review_id' });

module.exports = ReviewMedia;
