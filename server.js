const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const fileUpload = require('express-fileupload');
const config = require('config');
const morgan = require('morgan');
const cors = require('cors');

const db = require('./src/db');

const utils = require('./src/utils');
const routes = require('./routes');

const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(cors());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(fileUpload({
  limits: {
    fileSize: 100000000, // 100mb
  },
  useTempFiles: false,
  tempFileDir: '/tmp/',
  abortOnLimit: true, // won't set req.files when too large
  limitHandler: (req, res, next) => {
    utils.renderError(req, res, 413, 'File size too large! (Max 100MB)');
    next();
  },
}));

const store = new MongoDBStore({
  uri: config.get('db.url'),
  collection: 'sessions',
});

app.set('trust proxy', 1); // trust first proxy
app.use(session({
  secret: config.get('app.sessionSecret'),
  resave: false,
  saveUninitialized: true,
  store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

db.connectToServer((err) => {
  if (err) {
    utils.log('error', 'Could not connect to database');
    return;
  } else {
    utils.log('info', 'Connected to database');
  }

  app.listen(config.get('app.port'), () => {
    utils.log('info', `Server started on port ${config.get('app.port')}`);
  });
});
