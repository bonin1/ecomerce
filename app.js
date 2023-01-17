const express = require('express')
const app = express()
const session = require('express-session')
const db = require('./databaze')
const d2 = require('./db2')
const bcrypt = require('bcryptjs');
const { render } = require('ejs');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { Sequelize, literal } = require('sequelize');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const validator = require('validator');
const https = require('https');
const fs = require('fs');

require('dotenv').config()




    const Home = require('./Models/HomeModel')
    const Product = require('./Models/ProtectedModel');
    const Search = require('./Models/SearchModel')
    const Produkti = require('./Models/ProductIdModel')

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

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});



app.get('/protected', (req, res) => {
    if (!req.session.isLogged) {
        return res.redirect('/admin');
    }
    Product.findAll()
        .then(results => {
            res.render('protected', { data: results });
        })
        .catch(err => {
            console.error(err);
        });
});



app.get('/', (req, res) => {
    const isLoggedIn = req.session.isLoggedIn;
    const category = req.query.category;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;

    let query = { order: [[Sequelize.fn('RAND')]], limit: 9 };
    if (category || (minPrice && maxPrice)) {
        query.where = {};
    }
    if (category) {
        query.where.kategoria = category;
    }
    if (minPrice && maxPrice) {
        query.where.cmimi_produktit = {
            [Sequelize.Op.between]: [minPrice, maxPrice]
        };
    }

    Home.findAll(query)
        .then(results => {
            res.render('home', { data: results, isLoggedIn, minPrice, maxPrice });
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
    const isLoggedIn = req.session.isLoggedIn;
    const id = req.params.id;

    try {
        const item = await Produkti.findOne({
            where: { id }
        });
        
        const randomItems = await Produkti.findAll({
            order: Sequelize.literal('RAND()'),
            limit: 4
        });
        

        res.render('produkt', { item:item.dataValues, items: randomItems, isLoggedIn });
        if(typeof item === 'object'){
            res.render('produkt', { item: item.dataValues, items: randomItems, isLoggedIn });
        }
        
    } catch(err) {
        console.log(err);
        res.status(500).render('error', { error: 'An error occurred' });
    }
    
});








app.post('/cart', (req, res) => {
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
    res.render('register',{message:''})
})

app.get('/changepassword',(req,res)=>{
    res.render('changepassword')
})
app.get('/admin',(req,res)=>{
    res.render('admin')
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




const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later'
});

const csrfProtection = csrf();

app.use(csrfProtection);

app.get('/login', csrfProtection, (req, res) => {
    res.render('login', { csrfToken: req.csrfToken() , message:''});
});



app.post('/login', loginLimiter, csrfProtection, (req, res) => {
    
    const email = req.body.email;
    const password = req.body.password;
    if (!validator.isEmail(email)) {
        return res.render('login', { message: 'Invalid email address',csrfToken: req.csrfToken() });
    }

    if (!validator.isLength(password, { min: 8 })) {
        return res.render('login', { message: 'Password must be at least 8 characters long',csrfToken: req.csrfToken()  });
    }

    const query = 'SELECT * FROM login_information WHERE email = ?';
        db.query(query, email, async (err, results, fields) => {
            if (err) {
                console.log(err);
            }
            if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
                return res.render('login', { message: 'Incorrect email or password',csrfToken: req.csrfToken() });
            }
            req.session.isLoggedIn = true;
            req.session.userId = results[0].id;
            res.redirect('/cart');
        });
});





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



app.post('/admin',(req,res)=>{
    const {email,password} = req.body
    const query =`SELECT * FROM admin_information WHERE admin_email = ?`
    db.query(query,[email], async(err,results,fields)=>{
        if(err){
            console.log(err)
        }
        if(results.length == 0 || !(await bcrypt.compare(password,results[0].password))) {
            return res.render('admin',{message:'passwordi ose emaili jon keq'})
        }
        req.session.isLogged = email
        res.redirect('/protected')
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

app.get('/item/:id',(req,res)=>{
    if (!req.session.isLogged) {
        return res.redirect('/admin');
    }
    const {id} = req.params
    const query = `SELECT * FROM produktet WHERE id = ?`
    db.query(query,id,(err,results,fields)=>{
        if(err){
            console.log(err)
        }
        res.render('produktet',{data:results})
    })
})

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
    const{emri_produktit,pershkrimi_produktit,cmimi_produktit,origjina_produktit,sasia_produktit,kategoria,foto_produktit} = req.body
    const query = `UPDATE produktet SET emri_produktit = ?, pershkrimi_produktit = ?, cmimi_produktit = ?, origjina_produktit = ?, sasia_produktit = ?,kategoria = ?, foto_produktit = ?  WHERE id = ?`
    const data = [emri_produktit,pershkrimi_produktit,cmimi_produktit,origjina_produktit,sasia_produktit,kategoria,foto_produktit,id]
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




const middleware = (req,res,next)=>{
    if(!req.session.isLogged){
        res.redirect('/admin')
    }
    else{
        next()
    }
}
app.get('/protected',middleware,(req,res)=>{
    res.render('protected')
})




app.listen(8080,()=>{
    console.log('Ready!')
})