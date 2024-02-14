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
const fs = require('fs')
const path = require('path');


    const Home = require('./Models/HomeModel')
    const Search = require('./Models/SearchModel')
    const Produkti = require('./Models/ProductIdModel')
    const Review = require('./Models/ReviewsModel')
    const ProduktImages = require('./Models/ProduktImagesModel');
    app.use(bodyParser.json()); 
    app.use(bodyParser.urlencoded({ extended: true }));

    const Footer = require('./Footer')



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

app.use('/register',require('./routes/RegisterRoute'))
app.use('/login',require('./routes/LoginRoute'))
app.use('/admin',require('./routes/AdminRoute'))
app.use('/protected',require('./routes/ProtectedRoute'))


app.get('/', [
    check('category').optional().isString(),
    check('minPrice').optional().isFloat(),
    check('maxPrice').optional().isFloat()
    ], async (req, res) => {
        const productId = req.params.id;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const category = req.query.category ? req.sanitize(req.query.category) : null;
        const minPrice = req.query.minPrice ? req.sanitize(req.query.minPrice) : null;
        const maxPrice = req.query.maxPrice ? req.sanitize(req.query.maxPrice) : null;

        const query = {
            order: [[Sequelize.fn('RAND')]],
            limit: 12
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
            model: Produkti,
            mapToModel: true
        })
        .then(async results => {
            for (const row of results) {
                const images = await ProduktImages.findAll({
                    where: { produkt_id: row.id },
                    limit: 1,
                    order: [['id', 'ASC']]
                });
                row.produktimage = images[0] || null;
            }
            res.render('home', { data: results, isLoggedIn:req.session.isLoggedIn, minPrice, maxPrice,footer: Footer() });
        })
        .catch(err => {
            console.log(err);
        });
    });





    app.get('/image/:id', (req, res) => {
        const productId = req.params.id;
    
        ProduktImages.findOne({
            where: { produkt_id: productId },
            order: [['id', 'ASC']]
        })
        .then(image => {
            if (image) {
                const imageBuffer = image.foto_produktit;
                let contentType;
                if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) {
                    contentType = 'image/jpeg';
                } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46) {
                    contentType = 'image/gif';
                } else {
                    contentType = 'image/png'; 
                }
                res.setHeader('Content-Type', contentType);
                res.end(imageBuffer);
            } else {
                res.status(404).send('Image not found');
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Internal server error');
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
    
        // Check if product is not null before accessing its properties
        if (product !== null) {
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
        } else {
            console.log('Product not found');
            res.status(404).send('Product not found');
        }
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
            res.render('cart',{isLoggedIn:req.session.isLoggedIn});
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
            res.render('cart', { items: results ,isLoggedIn:req.session.isLoggedIn ,footer: Footer() });
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

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        }
        res.clearCookie('rememberToken');
        res.redirect('/login');
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

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/uploads/');
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});



app.post('/upload',function(req,res){
    upload(req,res,function(err){
        if(err){
            console.log(err)
        }else if(!req.file){
            console.log('No file uploaded')
        }else{
            console.log(req.file)
            const image = {
                name: req.file.originalname,
                data: fs.readFileSync(req.file.path)
            }
        }
        
    })
})


app.post('/updateImage/:id', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const newImage = {
        name: req.file.originalname,
        data: fs.readFileSync(req.file.path)
    };

    try {
        const image = await ProduktImages.findByPk(id);
        if (!image) {
            return res.json({ error: 'Image not found' });
        }
        image.foto_produktit = newImage.data;
        await image.save();
        await fs.promises.unlink(req.file.path);

        res.redirect(`/item/${id}`);
    } catch (error) {
        console.error(error);
        res.redirect(`/item/${id}`);
    }
});

app.post('/insertImages/:id', upload.array('files', 10), async (req, res) => {
    const { id } = req.params;
    try {
        const imagesPromises = req.files.map(async (file) => {
            const newImage = {
                name: file.originalname,
                data: fs.readFileSync(file.path)
            };
            const image = await ProduktImages.create({
                produkt_id: id,
                foto_produktit: newImage.data
            });
            await fs.promises.unlink(file.path);
            return image;
        });
        await Promise.all(imagesPromises);
        res.redirect(`/item/${id}`);
    } catch (error) {
        console.error(error);
        res.redirect(`/item/${id}`);
    }
});



app.delete('/deleteImage/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const image = await ProduktImages.findByPk(id);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }
        await image.destroy();
        return res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error deleting image' });
    }
});


app.get('/item/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const data = await Produkti.findByPk(id);
        if (!data) {
            return res.status(404).send('Product not found');
        }

        const images = await ProduktImages.findAll({
            where: { produkt_id: id }
        });

        res.render('produktet', { data, images, id });
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