const express = require('express')
const app = express()
require('dotenv').config()

const PORT = process.env.PORT || 3001

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