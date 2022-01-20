const { Router } = require('express');
const express = require('express');
const route = express.Router();
const passport = require('passport');
const {applyPassport} = require('../passport');
applyPassport(passport);


const paymentController = require('../controllers/PaymentController');

route.get('/paymentHistory', paymentController.paymentHistory);
route.get('/signin',paymentController.signin);
route.get('/', paymentController.home);
route.get('/changePassword', paymentController.getchangePassword);
route.get('/rechargeMoney', paymentController.getRechargeMony);
route.get('/balance',passport.authenticate('jwt', { session: false }), paymentController.getCurrentBalance);

route.post('/signin', paymentController.doSignIn);
route.post('/changePassword',paymentController.postChangePassword);
route.post('/rechargeMoney', paymentController.postRechargeMony);
route.post('/addPayment', passport.authenticate('jwt', { session: false }),paymentController.createAccount);
route.post('/addAccount',paymentController.createAccount);
module.exports = route;