const { DataTypes } = require('sequelize');
const db = require('../database');

const UserImage = db.define('user_images', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true,
    freezeTableName: true,
});

UserImage.sync({ force: false }).then(() => {
    console.log('UserImage table synchronized');
}).catch(error => {
    console.error('Error synchronizing UserImage table:', error);
});

module.exports = UserImage;