const router = require('express').Router();
const config = require('config');
const fs = require('fs');

const utils = require('../src/utils');
const db = require('../src/db');

router.get('/', utils.ensureAuthenticated, (req, res) => {
  // get clips owned by user
  db.getDb().collection('clips').find({uploadedBy: req.user.id}).toArray((err, clips) => {
    if (err) utils.renderError(req, res, 500, 'Could not get your clips!');
    return utils.render(req, res, 'manage', 'Manage Clips', {clips});
  });
});

router.get('/upload', utils.ensureAuthenticated, (req, res) => {
  return utils.render(req, res, 'upload', 'Upload', {});
});

router.post('/upload', utils.ensureAuthenticated, async (req, res) => {
  const uploadedAt = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  const fileName = `${req.user.id}_${req.body.name}_${uploadedAt}`;
  let extension;
  const file = req.files.file;

  const document = {
    uploadedBy: req.user.id,
    alias: req.body.alias,
    name: req.body.name,
    description: req.body.description,
    country: req.body.country,
    uploadedAt,
  };

  // check the type of file uploaded
  if (file.mimetype === 'application/octet-stream') { // demos are a hex file
    extension = 'dem';
    document.type = 'demo';
  } else if (file.mimetype.startsWith('video/')) { // videos
    extension = file.name.substring(file.name.lastIndexOf('.'), file.name.length); // file extension
    document.type = 'video';
  } else {
    return utils.renderError(req, res, 400, 'File type invalid. Please upload a demo or a video');
  }

  document.fileName = `${fileName}.${extension}`;

  db.getDb().collection('clips').insertOne(document, (err, res) => {
    if (err) {
      utils.log('error', err);
      return utils.renderError(req, res, 500, 'Failed to upload file, contact developer for more');
    }
  });

  // Look at making this a util function
  // Does the directory exist?
  if (!fs.existsSync(`${config.get('fileLocation')}/${req.user.id}`)) {
    fs.mkdirSync(`${config.get('fileLocation')}/${req.user.id}`);
  }

  // Move file
  file.mv(`${config.get('fileLocation')}/${req.user.id}/${fileName}.${extension}`, (err) => {
    if (err) {
      utils.log('error', err);
      return utils.renderError(req, res, 500, 'Failed to move file, contact developer for more');
    } else {
      return res.redirect('/manage/upload');
    }
  });
});

module.exports = router;
