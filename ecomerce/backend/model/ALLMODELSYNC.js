const UserModel = require('./UserModel');
const UserImage = require('./UserImageModel');
const UserActivityLog = require('./UserActivityLogModel');

const ProductModel = require('./ProduktModel');
const ProductCategory = require('./ProductCategoryModel');
const ProductMedia = require('./ProduktMediaModel');
const ProductAdditionalDetails = require('./ProduktAdditionalDetails');
const AuditLog = require('./AuditLogModel');
const PaymentMethod = require('./PaymentMethodsModel');
const ProductPaymentMethod = require('./ProductPaymentMethodsModel');
const Order = require('./OrderModel');
const OrderItem = require('./OrderItemModel');
const OrderTracking = require('./OrderTrackingModel');
const Subscribe = require('./SubscribeModel');
const CareersModel = require('./CareersModel');
const CareerApplicationModel = require('./CareerApplicationModel');
const ProduktReview = require('./ProduktReview');
const ReviewMedia = require('./ReviewMediaModel');

const syncModels = async () => {
    try {
        await UserModel.sync({ alter: false });
        await UserImage.sync({ alter: false });
        await UserActivityLog.sync({ alter: false });
        await ProductCategory.sync({ alter: false });
        await ProductModel.sync({ alter: false });
        await ProductMedia.sync({ alter: false });
        await ProductAdditionalDetails.sync({ alter: false });
        await AuditLog.sync({ alter: false });
        await PaymentMethod.sync({ alter: false });
        await ProductPaymentMethod.sync({ alter: false });
        await Order.sync({ alter: false });
        await OrderItem.sync({ alter: false });
        await OrderTracking.sync({ alter: false });
        await Subscribe.sync({ alter: false });
        await CareersModel.sync({ alter: false });
        await CareerApplicationModel.sync({ alter: false });
        await ProduktReview.sync({ alter: false });
        await ReviewMedia.sync({ alter: false });

        console.log('All models synchronized successfully');
    } catch (error) {
        console.error('Error syncing models:', error);
    }
};

module.exports = syncModels;