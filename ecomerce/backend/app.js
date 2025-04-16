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
// Register all routes
const registerRoutes = require('./routes'); // Import the central route registration function
registerRoutes(app); // Register all routes
// ---------------------------------------------------

app.listen(PORT,()=>{
    console.log('Server is running on port: ' + PORT)
    console.log(`http://localhost:${PORT}`)
})