const Subscribe = require('../../model/SubscribeModel');
const crypto = require('crypto');
const emailServices = require('../../services/emailServices');

exports.createSubscription = async (email) => {
    try {
        const existingSubscription = await Subscribe.findOne({ where: { email } });
        
        if (existingSubscription) {
            if (!existingSubscription.isActive) {
                const unsubscribeToken = crypto.randomBytes(32).toString('hex');
                
                existingSubscription.isActive = true;
                existingSubscription.unsubscribedAt = null;
                existingSubscription.unsubscribeToken = unsubscribeToken;
                await existingSubscription.save();
                
                await emailServices.sendSubscriptionWelcomeEmail(email, unsubscribeToken);
                
                return { success: true, message: 'Subscription reactivated', data: existingSubscription };
            }
            return { success: false, message: 'Email is already subscribed' };
        }
        
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        
        const newSubscription = await Subscribe.create({ 
            email, 
            unsubscribeToken 
        });
        
        await emailServices.sendSubscriptionWelcomeEmail(email, unsubscribeToken);
        
        return { success: true, message: 'Successfully subscribed', data: newSubscription };
    } catch (error) {
        console.error('Error creating subscription:', error);
        throw error;
    }
};

exports.getSubscription = async (email) => {
    try {
        return await Subscribe.findOne({ where: { email } });
    } catch (error) {
        console.error('Error getting subscription:', error);
        throw error;
    }
};

exports.getSubscriptionByToken = async (token) => {
    try {
        return await Subscribe.findOne({ where: { unsubscribeToken: token } });
    } catch (error) {
        console.error('Error getting subscription by token:', error);
        throw error;
    }
};

exports.unsubscribe = async (email, token = null) => {
    try {
        let subscription;
        
        if (token) {
            subscription = await Subscribe.findOne({ 
                where: { 
                    unsubscribeToken: token,
                    email 
                } 
            });
        } else {
            subscription = await Subscribe.findOne({ where: { email } });
        }
        
        if (!subscription) {
            return { success: false, message: 'Subscription not found' };
        }
        
        if (!subscription.isActive) {
            return { success: false, message: 'Email is already unsubscribed' };
        }
        
        subscription.isActive = false;
        subscription.unsubscribedAt = new Date();
        await subscription.save();
        
        await emailServices.sendUnsubscribeConfirmationEmail(email);
        
        return { success: true, message: 'Successfully unsubscribed' };
    } catch (error) {
        console.error('Error unsubscribing:', error);
        throw error;
    }
};

exports.getAllSubscriptions = async (page = 1, limit = 10, activeOnly = false) => {
    try {
        const offset = (page - 1) * limit;
        const whereClause = activeOnly ? { isActive: true } : {};
        
        const { count, rows } = await Subscribe.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        
        return {
            totalItems: count,
            subscriptions: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    } catch (error) {
        console.error('Error getting all subscriptions:', error);
        throw error;
    }
};
