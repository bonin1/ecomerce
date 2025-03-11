const UserModel = require('./UserModel');
const UserImage = require('./UserImageModel');

const ProductModel = require('./ProduktModel');
const ProductCategory = require('./ProductCategoryModel');
const ProductMedia = require('./ProduktMediaModel');
const ProductAdditionalDetails = require('./ProduktAdditionalDetails');
const AuditLog = require('./AuditLogModel');
const PaymentMethod = require('./PaymentMethodsModel');
const ProductPaymentMethod = require('./ProductPaymentMethodsModel');

const syncModels = async () => {
    try {
        await UserModel.sync({ alter: false });
        await UserImage.sync({ alter: false });
        await ProductCategory.sync({ alter: false });
        await ProductModel.sync({ alter: false });
        await ProductMedia.sync({ alter: false });
        await ProductAdditionalDetails.sync({ alter: false });
        await AuditLog.sync({ alter: false });
        await PaymentMethod.sync({ alter: false });
        await ProductPaymentMethod.sync({ alter: false });

        console.log('All models synchronized successfully');
    } catch (error) {
        console.error('Error syncing models:', error);
    }
};

module.exports = syncModels;