const express = require('express')
const cors = require('cors')
const app = express()
require('dotenv').config()

const PORT = process.env.PORT || 8080

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))

app.use(express.json())

app.use('/static',express.static('static'))
app.set('view engine','ejs')

// ---------------------------------------------------
// Sync all models
const syncModels = require('./model/ALLMODELSYNC');
syncModels();
// ---------------------------------------------------


// ---------------------------------------------------
// Routes

const routes = require('./routes/StaticRoutes');
routes.setupStaticRoutes(app);

app.use('/auth', require('./routes/AuthRoute'));

// ---------------------------------------------------

app.listen(PORT,()=>{
    console.log('Server is running on port: ' + PORT)
    console.log(`http://localhost:${PORT}`)
})