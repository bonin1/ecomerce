const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const app = express()
require('dotenv').config()
const path = require('path')

const PORT = process.env.PORT || 8080

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

app.use('/static',express.static('static'))
app.set('view engine','ejs')
app.set('views', path.join(__dirname, 'views'))

// ---------------------------------------------------
// Sync all models
const syncModels = require('./model/ALLMODELSYNC');
syncModels();
// ---------------------------------------------------


// ---------------------------------------------------
// Routes

app.get('/',(req,res)=>{
    res.render('home')
})

const routes = require('./routes/StaticRoutes');
routes.setupStaticRoutes(app);

app.use('/auth', require('./routes/AuthRoute'));

const profileRoutes = require('./routes/ProfileManagementRoute');
app.use('/api', profileRoutes);

app.use('/admin', require('./routes/AdminRoute'));

app.use('/product', require('./routes/ProduktManagementRoute'));

// Add payment methods route
app.use('/payment-methods', require('./routes/PaymentMethodRoutes'));

// Add order routes
app.use('/orders', require('./routes/OrderRoutes'));

// Add newsletter subscription routes
app.use('/newsletter', require('./routes/SubscribeRoute'));

// Add career routes
app.use('/careers', require('./routes/CareerRoute'));

// Add tracking routes
app.use('/track-order', require('./routes/TrackOrderRoutes'));

// ---------------------------------------------------

app.listen(PORT,()=>{
    console.log('Server is running on port: ' + PORT)
    console.log(`http://localhost:${PORT}`)
})