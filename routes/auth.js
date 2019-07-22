const passport = require('passport');
const router = require('express').Router();
const SteamStrategy = require('passport-steam').Strategy;
require('dotenv').config();

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new SteamStrategy({
  returnURL: 'http://localhost:3000/auth/steam/return',
  realm: 'http://localhost',
  apiKey: process.env.STEAM_APIKEY,
},
(identifier, profile, done) => {
  process.nextTick(() => {
    profile.identifier = identifier;
    console.log(`User ${profile.id} logged in.`);
    return done(null, profile);
  });
}));


// AUTH ROUTES \\
/**
 * The actual login
 */
router.get('/steam',
    passport.authenticate('steam', {failureRedirect: '/'}),
    (req, res) => {
      res.redirect('/');
    }
);

/**
 * After the login
 */
router.get('/steam/return',
    (req, res, next) => {
      req.url = req.originalUrl;
      next();
    },
    passport.authenticate('steam', {failureRedirect: '/'}),
    (req, res) => {
      res.redirect('/');
    }
);

router.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.log(error);
    }
    res.redirect('/');
  });
});

module.exports = router;
