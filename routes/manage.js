const router = require('express').Router();

const utils = require('../src/utils');

router.get('/', (req, res) => {
  // get clips owned by user
  utils.render(req, res, 'manage', 'Manage Clips', {});
});

module.exports = router;
