const router = require('express').Router();

const utils = require('../src/utils');

router.get('/', utils.ensureAuthenticated, (req, res) => {
  // get clips owned by user
  utils.render(req, res, 'manage', 'Manage Clips', {});
});

router.get('/upload', utils.ensureAuthenticated, (req, res) => {
  utils.render(req, res, 'upload', 'Upload', {});
});

router.post('/upload', utils.ensureAuthenticated, (req, res) => {
  console.log(req.body);
  console.log(req.files.file);
  req.files.file.mv(cofig.get('fileLocation'), (err) => {
    if (err) throw err;
    res.redirect('/manage');
  });
});

module.exports = router;
