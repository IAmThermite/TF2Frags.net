const home = require('./home');
const auth = require('./auth');
const manage = require('./manage');

const router = require('express').Router();

router.use('/', home);
router.use('/auth', auth);
router.use('/manage', manage);

module.exports = router;
