const passport = require('passport');
const config = require('config');
const router = require('express').Router();
const SteamStrategy = require('passport-steam').Strategy;

const utils = require('../src/utils');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new SteamStrategy({
  returnURL: `${config.get('steam.realm')}${config.get('steam.returnUrl')}`,
  realm: config.get('steam.realm'),
  apiKey: config.get('steam.apiKey'),
},
(identifier, profile, done) => {
  process.nextTick(() => {
    profile.identifier = identifier;
    utils.log('info', `User ${profile.id} logged in.`);
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
      return res.redirect('/');
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
      return res.redirect('/');
    }
);

router.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      utils.log('error', error);
    }
    return res.redirect('/');
  });
});

module.exports = router;
