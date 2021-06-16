const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override')
const bcrypt = require('bcrypt');
const session = require('express-session');
const User = require('./models/user');

const Product = require('./models/product');

mongoose.connect('mongodb://localhost:27017/E-Market', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({ secret: 'notagoodsecret' }))


app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))

const categories = ['Fruit', 'Vegetable', 'Dairy','Dry Fruits'];

// login page

const requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/products/login')
    }
    next();
}

app.get('/products/register', (req, res) => {
    res.render('products/register')
})

app.post('/products/register', async (req, res) => {
    const { password, username } = req.body;
    const user = new User({ username, password })
    await user.save();
    req.session.user_id = user._id;
    res.redirect('/products')
})

app.get('/products/login', (req, res) => {
    res.render('products/login')
})
app.post('/products/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findAndValidate(username, password);
    if (foundUser) {
        req.session.user_id = foundUser._id;
        res.redirect('/products');
    }
    else {
        res.redirect('/products/login')
    }
})

app.post('/products/logout', (req, res) => {
    req.session.user_id = null;
    // req.session.destroy();
    res.redirect('/products/login');
})

// product

app.get('/', (req, res) => {
    res.render('products/home')
})

app.get('/products', requireLogin, async (req, res) => {
    const { category } = req.query;
    if (category) {
        const products = await Product.find({ category })
        res.render('products/index', { products, category })
    } else {
        const products = await Product.find({})
        res.render('products/index', { products, category: 'All' })
    }
})

app.get('/products/new', requireLogin, (req, res) => {
    res.render('products/new', { categories })
})

app.post('/products', requireLogin, async (req, res) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.redirect(`/products/${newProduct._id}`)
})

app.get('/products/:id', requireLogin, async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id)
    res.render('products/show', { product })
})

app.get('/products/:id/edit', requireLogin, async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    res.render('products/edit', { product, categories })
})

app.put('/products/:id', requireLogin, async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });
    res.redirect(`/products/${product._id}`);
})

app.delete('/products/:id', requireLogin, async (req, res) => {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    res.redirect('/products');
})



app.listen(3000, () => {
    console.log("APP IS LISTENING ON PORT 3000!")
})


