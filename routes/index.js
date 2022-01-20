const paymentRoute = require('./payment');
function route(app) { 
    app.use('/', paymentRoute);          
}

module.exports = route;