const passport    = require('passport');
const passportJWT = require("passport-jwt");
const ExtractJWT = passportJWT.ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy   = passportJWT.Strategy;

const db = require('../../models');
passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, cb) {
        //Assume there is a DB module pproviding a global UserModel
        return db.User.findOne({where:{email:email, password:password}})
            .then(user => {
                if (!user) {
                    return cb(null, false, {message: 'Incorrect email or password.'});
                }
                return cb(null, user.get({plain:true}), {
                    message: 'Logged In Successfully'
                });
            })
            .catch(err => {
                return cb(err);
            });
    }
));

passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey   : 'flubbybunny'
    },
    function (jwtPayload, cb) {
        //find the user in db if needed
        console.log(JSON.stringify(jwtPayload));
        return db.User.findOne({where:{id:jwtPayload}})
            .then(user => {
                return cb(null, user.get({plain:true}));
            })
            .catch(err => {
                return cb(err);
            });
    }
));
