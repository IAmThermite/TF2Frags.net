const router = require('express').Router();

const utils = require('../src/utils');

router.get('/', (req, res) => {
  return utils.render(req, res, 'index', 'Home', {});
});

module.exports = router;
