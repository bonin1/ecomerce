const express = require('express')
const router = express.Router();


const Produkti = require('../Models/ProductIdModel');


router.get('/', (req, res) => {
    if (!req.session.isLogged) {
        return res.redirect('/admin');
    }
    Produkti.findAll()
        .then(results => {
            res.render('protected', { data: results });
        })
        .catch(err => {
            console.error(err);
        });
});

router.post('/', async (req, res) => {
    const {
        emri_produktit,
        company_name,
        pershkrimi_produktit,
        cmimi_produktit,
        origjina_produktit,
        sasia_produktit,
        kategoria,
        garancioni
    } = req.body;

    try {
        const existingProduct = await Produkti.findOne({
            where: {
                emri_produktit
            }
        });

        if (existingProduct) {
            return res.render('protected', { alert: 'Ky produkt ekziston' });
        } else {
            await Produkti.create({
                emri_produktit,
                company_name,
                pershkrimi_produktit,
                cmimi_produktit,
                origjina_produktit,
                sasia_produktit,
                kategoria,
                garancioni
            });

            return res.render('protected', { alert: 'Produkti u krijua me sukses' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
});

module.exports = router