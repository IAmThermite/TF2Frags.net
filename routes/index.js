const home = require('./home');
const auth = require('./auth');
const manage = require('./manage');
const clips = require('./clips');
const api = require('./api');
const utils = require('../src/utils');

const router = require('express').Router();

router.use('/', home);
router.use('/auth', auth);
router.use('/manage', manage);
router.use('/clips', clips);
router.use('/api', api);

router.use('*', (req, res) => {
  utils.renderError(req, res, 404, 'Page Not Found');
});

module.exports = router;
