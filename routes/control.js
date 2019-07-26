const router = require('express').Router();
const utils = require('../src/utils');

router.get('/', utils.ensureAuthenticated, utils.canUserView, (req, res) => {
  utils.render(req, res, 'control', 'Control Panel');
});

module.exports = router;
