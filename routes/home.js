const router = require('express').Router();

const utils = require('../src/utils');

router.get('/', (req, res) => {
  utils.render(req, res, 'index', 'Home', {});
});

module.exports = router;
