const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
const db = require('./models/PaymentModel');
const bcrypt = require('bcrypt');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

var jwtOptions = {};

jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'mySecretKey';

const strategy = new JwtStrategy(jwtOptions,async (payload,done)=>{
    try {
        account = await db.getAccountInfo(payload.account_id, 'patient', 'patient_id');            
        if (!account) {
            return done(null, false, { message: 'Incorrect patient id.' });
        }
        return done(null, account);
    } catch (error) {
        return done(error);
    }
});
module.exports.applyPassport = passport =>{
    passport.use(strategy);
}
module.exports.localStrategy = app => {
    passport.use(new LocalStrategy({
        usernameField: 'accountId',
        passwordField: 'pwd'
    },
        async (accountId, password, done) => {            
            let account;
            
            try {
                account = await db.getAccountInfo(accountId);          
                if (!account) {
                    return done(null, false, { message: 'Incorrect username.' });
                }          
                const challengeResult = await bcrypt.compare(password, account.password);
                if (!challengeResult) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, account);
            } catch (error) {
                return done(error);
            }
        }
    ));
    passport.serializeUser(function (account, done) {
        done(null, account);
    });

    passport.deserializeUser(async (account, done) => {
        try {
            const u = await db.getAccountInfo(account.account_id);
            done(null, u);
        } catch (error) {
            done(new Error('error'), null);
        }
    });
    app.use(passport.initialize());
    app.use(passport.session());
};