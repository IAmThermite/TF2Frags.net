const router = require('express').Router();

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

router.post('/upload', utils.ensureAuthenticated, (req, res) => {
  const uploadedAt = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');

  if (req.files) { // will not exist if file too large
    const fileName = `${req.user.id}_${req.body.name}_${uploadedAt}`;
    const file = req.files.file;
    let extension;

    const pairs = req.body.ticks.split('\r\n');
    const ticks = [];
    pairs.forEach((element) => {
      const elems = element.split(' ');
      if (elems.length === 2 && elems[0] < elems[1]) { // start tick less than end tick
        ticks.push({start: elems[0], end: elems[1]});
      }
    });

    const document = {
      uploadedBy: req.user.id,
      alias: req.body.alias,
      name: req.body.name,
      description: req.body.description,
      country: req.body.country,
      uploadedAt,
      lastPlayed: uploadedAt,
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

    // save to db
    db.getDb().collection('clips').insertOne(document, (err, res) => {
      if (err) {
        utils.log('error', err);
        return utils.renderError(req, res, 500, 'Failed to upload file, contact developer for more');
      }
    });

    // save the file
    utils.saveFile(req.user.id, file, fileName, extension).then(() => {
      return res.redirect('/manage/upload');
    }).catch((err) => {
      utils.log('error', err);
      return utils.renderError(req, res, 500, 'Failed to move file, contact developer for more');
    });
  } else if (req.body.url) { // url uploading
    // valid youtube url
    if (req.body.url.startsWith('https://www.youtube.com/watch?')
          || req.body.url.startsWith('https://youtube.com/watch?')
          || req.body.url.startsWith('https://youtu.be/')) {
      const url = new URL(req.body.url);
      url.searchParams.get('v');
      const code = url.searchParams.get('v'); // extract the video id from the provided url (could be lots of different things)

      db.getDb().collection('clips').findOne({url: code}, (err, result) => {
        if (err) {
          return utils.renderError(req, res, 500, 'Could not save URL! Contact developer for more');
        }
        if (result) {
          return utils.renderError(req, res, 400, 'URL already saved!');
        }

        const document = {
          name: req.body.name,
          uploadedBy: req.user.id,
          type: 'url',
          url: code,
          uploadedAt,
          lastPlayed: uploadedAt,
        };

        // upload clip to db
        db.getDb().collection('clips').insertOne(document, (err, result) => {
          if (err) {
            utils.log('error', err);
            return utils.renderError(req, res, 500, 'Failed to save URL, contact developer for more');
          } else {
            return res.redirect('/manage/upload');
          }
        });
      });
    } else {
      return utils.renderError(req, res, 400, 'Not an valid/acceptable YouTube URL');
    }
  } else {
    return utils.renderError(req, res, 400, 'Bad Request');
  }
});

module.exports = router;
