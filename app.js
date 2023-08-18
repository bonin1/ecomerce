const express = require('express')
const app = express()
const session = require('express-session')
const db = require('./databaze')
const d2 = require('./db2')
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const { Sequelize, literal } = require('sequelize');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const  {check,validationResult} = require('express-validator')
const multer = require('multer');


    const Home = require('./Models/HomeModel')
    const Search = require('./Models/SearchModel')
    const Produkti = require('./Models/ProductIdModel')
    const Review = require('./Models/ReviewsModel')
    const ProduktImages = require('./Models/ProduktImagesModel');

    app.use(bodyParser.json()); 
    app.use(bodyParser.urlencoded({ extended: true }));





app.use(cookieParser());
app.use('/static',express.static('static'))
app.set('view engine','ejs')
app.use(express.urlencoded({extended:false}))
app.use(express.json())
//cookies
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{maxAge: 30 * 60 * 1000} 
}))


app.use('/login',require('./routes/LoginRoute'))
app.use('/admin',require('./routes/AdminRoute'))
app.get('/protected',require('./routes/ProtectedRoute'))




app.get('/', [
    check('category').optional().isString(),
    check('minPrice').optional().isFloat(),
    check('maxPrice').optional().isFloat()
    ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const category = req.query.category ? req.sanitize(req.query.category) : null;
        const minPrice = req.query.minPrice ? req.sanitize(req.query.minPrice) : null;
        const maxPrice = req.query.maxPrice ? req.sanitize(req.query.maxPrice) : null;

        const query = {
            order: [[Sequelize.fn('RAND')]],
            limit: 9
        };

        if (category || (minPrice && maxPrice)) {
            query.where = {};
        }

        if (category) {
            query.where.kategoria = { [Sequelize.Op.eq]: category };
        }

        if (minPrice && maxPrice) {
            query.where.cmimi_produktit = {
                [Sequelize.Op.between]: [minPrice, maxPrice]
            };
        }

        Home.findAll({
            ...query,
            replacements: query.where,
            model: Home,
            mapToModel: true
        })
        .then(results => {
            res.render('home', { data: results, isLoggedIn:req.session.isLoggedIn, minPrice, maxPrice });
        })
        .catch(err => {
            console.log(err);
        });
    });










app.post('/filter', (req, res) => {
    const category = req.body.category;
    const minPrice = req.body.minPrice;
    const maxPrice = req.body.maxPrice;

    let query = `SELECT * FROM produktet WHERE sasia_produktit > 0`;
    if (category || (minPrice && maxPrice)) {
        query += ` AND `;
    }
    if (category) {
        query += `kategoria = '${category}'`;
    }
    if (minPrice && maxPrice) {
        if (category) {
            query += ` AND `;
        }
        query += `cmimi_produktit BETWEEN ${minPrice} AND ${maxPrice}`;
    }
    query += ` ORDER BY RAND() LIMIT 9`;

    db.query(query, (err, results) => {
        if (err) {
        console.log(err);
        }
        res.render('home', { data: results, isLoggedIn: req.session.isLoggedIn, minPrice, maxPrice });
    });
});


app.get('/search', (req, res) => {
    const searchQuery = req.query.q;
    Search.findAll({
        where: {
            emri_produktit: {
                [Sequelize.Op.like]: `%${searchQuery}%`
            }
        }
    }).then(results => {
        res.json(results);
    }).catch(err => {
        console.log(err);
        res.sendStatus(500);
    });
});
app.get('/produkt/:id', async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;
    const isLoggedIn = req.session.isLoggedIn;
    const productId = req.params.id;

    try {
        const product = await Produkti.findOne({
            where: { id: productId }
        });
        const images = await ProduktImages.findAll({
            where: { produkt_id: productId }
        });
        const reviews = await Review.findAll({
            where: { product_id: req.params.id },
            limit: limit,
            offset: offset
        });
        const reviewCount = reviews.length;
        let totalRating = 0;
        reviews.forEach(review => {
            totalRating += review.rating;
        });
        let averageRating = 0;
        if (reviewCount > 0) {
            averageRating = (totalRating / reviewCount).toFixed(1);
        }
        const randomItems = await Produkti.findAll({
            order: Sequelize.literal('RAND()'),
            limit: 4
        });
        const productPrice = parseFloat(product.dataValues.cmimi_produktit);
        const dividedPrice = (productPrice / 12).toFixed(2);
        res.render('produkt', { item: product.dataValues, images, averageRating, reviewCount, items: randomItems, isLoggedIn, dividedPrice });
    } catch (err) {
        console.log(err);
    }
});



// item: product.dataValues,


app.post('/produkt/:id', async (req, res) => {
    const userId = req.session.userId;
    const { rating, product_id, comment } = req.body;
    if (!userId) return res.redirect('/login');

    try {
        const existingReview = await Review.findOne({
            where: { product_id, userId }
        });
        if (existingReview) {
            return res.redirect(`/produkt/${product_id}`);
        }
        await Review.create({ rating, product_id, userId, comment });
        res.redirect(`/produkt/${product_id}`);
    } catch (err) {
        console.error(err);
        res.redirect(`/produkt/${product_id}`);
    }
});



app.post('/cart',(req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }

    const userId = req.session.userId;
    const itemId = req.body.id;
    const quantity = req.body.quantity;

    db.query(
        'INSERT INTO cart (user_id, produkt_id, quantity) VALUES (?, ?, ?)',
        [userId, itemId, quantity],
        (err, results) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
                return;
            }   
            res.render('cart');
        }
    );
});

// const csrfProtection = csrf();
// app.use(csrfProtection);

app.get('/cart', (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    const userId = req.session.userId;
    db.query(
        'SELECT produktet.*, cart.produkt_id, cart.quantity FROM produktet INNER JOIN cart ON produktet.id = cart.produkt_id WHERE cart.user_id = ?',
        [userId],
        (err, results) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
                return;
            }
            res.render('cart', { items: results  });
        }
    );
});



app.delete('/cart/:itemId', (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    
    const userId = req.session.userId;
    const itemId = req.params.itemId;

    db.query('DELETE FROM cart WHERE produkt_id = ? AND user_id = ?', [itemId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return;
        }
        db.query(
            'SELECT produktet.*, cart.produkt_id, cart.quantity FROM produktet INNER JOIN cart ON produktet.id = cart.produkt_id WHERE cart.user_id = ?',
            [userId],
            (err, results) => {
                if (err) {
                    console.error(err);
                    return;
                }
                res.send({ items: results});
            }
        );
    });
});







app.get('/cart/count', (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    const userId = req.session.userId;
    db.query(
        'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
        [userId],
        (err, results) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
                return;
            }
            res.send({ count: results[0].count });
        }
    );
});




app.get('/register',(req,res)=>{
    const isLoggedIn = req.session.isLoggedIn;
    res.render('register',{message:'', isLoggedIn})
})

app.get('/changepassword',(req,res)=>{
    const isLoggedIn = req.session.isLoggedIn;
    res.render('changepassword',{isLoggedIn})
})




app.get('/produktet',(req,res)=>{
    if (!req.session.isLogged) {
        return res.redirect('/admin');
    }
    const { alert } = req.query;
    db.query(`SELECT * FROM produktet`, (err, results) => {
        if (err) {
            console.error(err);
            return;
        }
        res.render('protected', { data: results, alert: decodeURIComponent(alert) });
    });
    
})

app.post('/logout',(req,res)=>{
    req.session.destroy(err=>{
        if(err){
            console.log(console.err)
        }
        
        res.redirect('/login')
        })
    })



app.post('/create',(req,res)=>{
    const{emri,mbiemri,email,password,oldpassword,status} = req.body
    const query = `SELECT email FROM login_information WHERE email = ? `
    db.query(query,email,async(err,results,fields)=>{
        if(err){
            console.log(err)
        }
        if(results.length > 0){
            return res.render('register',{message:'Ky email eksziston!'})
        }
        if(password != oldpassword){
            return res.render('register',{message:'Fjalkalimi nuk perputhet!'})
        }
        let hashpassword = await bcrypt.hash(password,8)
        const iquery = `INSERT INTO login_information (emri,mbiemri,email,password) VALUES (?,?,?,?)`;
        const data = [emri, mbiemri, email, hashpassword];
        db.query(iquery, data, (error, results, fields) => {
            if (error) {
                console.log(error);
            }
            res.render('login', { message: '' });
        });
    })
})











app.post('/changepassword',(req,res)=>{
    const{email,oldpassword,newpassword} = req.body
    const query = `SELECT password FROM login_information WHERE email = ?`
    db.query(query,email,(err,results)=>{
        if(err){
            console.log(err)
        }
        if(results.length == 0){
            res.redirect('/')
            console.log('Your old password is wrong!')
        }
        const dbPass = results[0].password
        bcrypt.compare(oldpassword,dbPass,(err,results)=>{
            if(!results){
                console.log('Your old password doesnt match')
                res.redirect('/login')
            }
            else{
                bcrypt.hash(newpassword,8,(err,hash)=>{
                    const updatequery = `UPDATE login_information SET password = ? WHERE email = ?`;
                    const data = [hash, email];
                    db.execute(updatequery, data, (error, results) => {
                        if (error) {
                        console.log(error);
                            } else {
                    console.log('Your password is changed');
                        res.redirect('/login');
                            }
                    });
                })
            }
        })
    })
})






app.post('/produkt/register',(req,res)=>{
    const {emri_produktit,pershkrimi_produktit,cmimi_produktit,origjina_produktit,sasia_produktit,kategoria,foto_produktit} = req.body
    const query = `SELECT * FROM produktet WHERE emri_produktit = ?`
    const data = [emri_produktit]
    db.query(query,data,(err,results,fields)=>{
        if(err){
            console.log(err)
        }
        if(results.length > 0){
            res.render('protected', { alert: 'Ky produkt ekziston' });
        }
        else{
            const query = `INSERT INTO produktet (emri_produktit,pershkrimi_produktit,cmimi_produktit,origjina_produktit,sasia_produktit,kategoria,foto_produktit) VALUES (?,?,?,?,?,?,?)`
            const data = [emri_produktit,pershkrimi_produktit,cmimi_produktit,origjina_produktit,sasia_produktit,kategoria,foto_produktit]
            db.query(query,data,(err,results,fields)=>{
                if(err){
                    console.log(err)
                }
                res.render('protected', { alert: 'Produkti u krijua me sukses' });
            })
        }
    })
})



app.post('/search', (req, res) => {
    var query = req.body.query;
    if (query === '') {
        res.send([]);
        return;
    }
    db.query(`SELECT * FROM produktet WHERE emri_produktit LIKE '%${query}%'`, (err, results) => {
        if (err) {
            console.error(err);
            res.send([]);
            return;
        }
        res.send(results);
    });
});





app.get('/item/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT * FROM produktet WHERE id = ?`;
        db.query(query, id, async (err, results, fields) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            try {
                const images = await ProduktImages.findAll({
                    where: { produkt_id: id }
                });
                res.render('produktet', { data: results, images: images });
            } catch (imageErr) {
                console.log(imageErr);
                return res.status(500).send('Internal Server Error');
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).send('Internal Server Error');
    }
});


app.get('/edit/:id',(req,res)=>{
    if (!req.session.isLogged) {
        return res.redirect('/admin');
    }
    const {id} = req.params
    const query = `SELECT * FROM produktet WHERE id = ?`
    db.query(query,id,(err,results,fields)=>{
        res.redirect('/produktet')
    })
})
app.post('/edit/:id',(req,res)=>{
    if(!req.session.isLogged){
        return res.redirect('/admin')
    }
    const {id} = req.params
    const{emri_produktit,pershkrimi_produktit,cmimi_produktit,origjina_produktit,sasia_produktit,kategoria} = req.body
    const query = `UPDATE produktet SET emri_produktit = ?, pershkrimi_produktit = ?, cmimi_produktit = ?, origjina_produktit = ?, sasia_produktit = ?,kategoria = ?  WHERE id = ?`
    const data = [emri_produktit,pershkrimi_produktit,cmimi_produktit,origjina_produktit,sasia_produktit,kategoria,id]
    db.query(query,data,(err,results,fields)=>{
        res.redirect(`/produktet?alert=Produkti%20u%20perditsua`)
    })
})

app.post('/delete/:id',(req,res)=>{
    const {id} = req.params
    const query = `DELETE from produktet WHERE id = ?`
    db.query(query,id,(err,results,fields)=>{
        if(err){
            console.log(err)
        }
        res.redirect(`/produktet?alert=Produkti%20eshte%20fshire`);
    })
})


app.listen(8080,()=>{
    console.log('Ready!')
})