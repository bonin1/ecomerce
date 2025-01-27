const UserModel = require('./UserModel');
const UserImage = require('./UserImageModel');
const ProductModel = require('./ProduktModel');


const syncModels = async () => {
    try {
        await UserModel.sync({ alter: false });
        await UserImage.sync({ alter: false });
        await ProductModel.sync({ alter: false });
        console.log('All models synchronized successfully');
    } catch (error) {
        console.error('Error syncing models:', error);
    }
};

module.exports = syncModels;