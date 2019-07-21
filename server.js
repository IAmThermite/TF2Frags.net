const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

const SteamStrategy = require('passport-steam').Strategy;

require('dotenv').config();

const app = express();
require('express-ws')(app);

app.use(helmet());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.set('trust proxy', 1); // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

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
  profile.identifier = identifier;
  console.log('USER LOGGED IN');
  console.log(profile);
  done(null, profile);
}));

const ensureAuthenticated = async (req, res, next) => {
  if (req.isAuthenticated()) {
    let authenticated = false;
    const allowed = process.env.ALLOWED_USERS.split(' ');
    await allowed.forEach((id) => {
      if (req.user.id === id) {
        authenticated = true;
        return;
      }
    });
    if (authenticated) {
      next();
    } else {
      res.status(403);
      res.render('error', {code: 403, message: 'Bugger off, this is my toy!'});
    }
  } else {
    res.status(401);
    res.render('error', {code: 401, message: 'Not Authenticated'});
  }
};

app.ws('/socket', ensureAuthenticated, (ws, req) => {
  ws.on('message', (msg) => {
    console.log(msg);
  });
  console.log('socket', req.testing);
});

app.get('/control', ensureAuthenticated, (req, res) => {
  res.render('control', {
    user: req.user,
  });
});

app.get('/', (req, res) => {
  res.render('index');
});

// AUTH ROUTES \\
/**
 * The actual login
 */
app.get('/auth/steam',
    passport.authenticate('steam', {failureRedirect: '/'}),
    (req, res) => {
      res.redirect('/control');
    }
);

/**
 * After the login
 */
app.get('/auth/steam/return',
    (req, res, next) => {
      req.url = req.originalUrl;
      next();
    },
    passport.authenticate('steam', {failureRedirect: '/'}),
    (req, res) => {
      res.redirect('/control');
    }
);

app.get('/auth/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.log(error);
    }
    res.redirect('/');
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
