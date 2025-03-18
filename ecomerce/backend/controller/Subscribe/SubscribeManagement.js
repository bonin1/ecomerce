const { createSubscription, unsubscribe, getSubscription, getSubscriptionByToken } = require('./CRUDoperations');
const { validateEmail } = require('../../utils/validation');

exports.handleSubscribe = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }
        
        const result = await createSubscription(email);
        
        if (!result.success) {
            return res.status(409).json(result); 
        }
        
        return res.status(201).json(result);
    } catch (error) {
        console.error('Subscription error:', error);
        return res.status(500).json({ success: false, message: 'Failed to process subscription' });
    }
};

exports.handleUnsubscribe = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        const result = await unsubscribe(email);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        return res.status(200).json(result);
    } catch (error) {
        console.error('Unsubscription error:', error);
        return res.status(500).json({ success: false, message: 'Failed to process unsubscription' });
    }
};

exports.handleOneClickUnsubscribe = async (req, res) => {
    try {
        const { email, token } = req.query;
        
        if (!email || !token) {
            return res.status(400).json({ success: false, message: 'Invalid unsubscribe link' });
        }
        
        const subscription = await getSubscriptionByToken(token);
        
        if (!subscription || subscription.email !== email) {
            return res.status(404).json({ success: false, message: 'Invalid or expired unsubscribe link' });
        }
        
        const result = await unsubscribe(email, token);
        
        return res.status(200).json(result);
    } catch (error) {
        console.error('One-click unsubscription error:', error);
        return res.status(500).json({ success: false, message: 'Failed to process unsubscription' });
    }
};

exports.verifySubscription = async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        const subscription = await getSubscription(email);
        
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                email: subscription.email,
                isActive: subscription.isActive,
                subscribedAt: subscription.subscribedAt
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({ success: false, message: 'Failed to verify subscription' });
    }
};
