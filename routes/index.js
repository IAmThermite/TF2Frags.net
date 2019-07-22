const home = require('./home');
const auth = require('./auth');
const control = require('./control');
const manage = require('./manage');

const router = require('express').Router();

router.use('/', home);
router.use('/auth', auth);
router.use('/control', control);
router.use('/manage', manage);

module.exports = router;
