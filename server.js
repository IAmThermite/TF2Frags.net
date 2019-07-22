const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const passport = require('passport');

const utils = require('./src/utils');
const routes = require('./routes');

require('dotenv').config();

const app = express();
require('express-ws')(app);

const port = process.env.PORT || 3000;

app.use(helmet());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.set('trust proxy', 1); // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

app.listen(port, () => {
  utils.log('info', `Server started on port ${port}`);
});
