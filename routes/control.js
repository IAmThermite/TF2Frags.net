const router = require('express').Router();
const utils = require('../src/utils');

router.get('/', utils.ensureAuthenticated, utils.canUserView, (req, res) => {
  utils.render(req, res, 'control', 'Control Panel');
});

// router.ws('/socket', utils.ensureAuthenticated, utils.canUserView, (ws, req) => {
//   ws.on('message', (msg) => {
//     console.log(msg);
//   });
//   console.log('socket', req.testing);
// });

module.exports = router;
