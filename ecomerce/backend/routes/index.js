const express = require('express');
const router = express.Router();

// Import all route modules
const staticRoutes = require('./StaticRoutes');
const authRoutes = require('./AuthRoute');
const profileRoutes = require('./ProfileManagementRoute');
const adminRoutes = require('./AdminRoute');
const productRoutes = require('./ProduktManagementRoute');
const paymentMethodRoutes = require('./PaymentMethodRoutes');
const orderRoutes = require('./OrderRoutes');
const subscribeRoutes = require('./SubscribeRoute');
const careerRoutes = require('./CareerRoute');
const trackOrderRoutes = require('./TrackOrderRoutes');
const reviewRoutes = require('./ReviewRoutes');


const registerRoutes = (app) => {
    app.get('/', (req, res) => {
        res.render('home');
    });
    staticRoutes.setupStaticRoutes(app); 

    app.use('/auth', authRoutes);
    app.use('/api', profileRoutes); 
    app.use('/admin', adminRoutes);
    app.use('/product', productRoutes);
    app.use('/payment-methods', paymentMethodRoutes);
    app.use('/orders', orderRoutes);
    app.use('/newsletter', subscribeRoutes);
    app.use('/careers', careerRoutes);
    app.use('/track-order', trackOrderRoutes);
    app.use('/reviews', reviewRoutes);
};

module.exports = registerRoutes;
