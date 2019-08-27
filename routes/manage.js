const xss = require('xss');
const config = require('config');
const request = require('request');
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
  return utils.render(req, res, 'upload', 'Upload', {key: config.get('recaptcha.siteKey')});
});

router.post('/upload', utils.ensureAuthenticated, (req, res) => {
  if (!req.body['g-recaptcha-response']) {
    return res.send('Please veryify that you are not a BOT');
  }
  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${config.get('recaptcha.secretKey')}&response=${req.body['g-recaptcha-response']}&remoteip=${req.connection.remoteAddress}}`;

  request(verificationUrl, (err, response, body) => {
    body = JSON.parse(body);
    if (!body.success) {
      return res.send('VERIFICATION FAILED');
    }
  });

  const uploadedAt = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');

  const document = {
    uploadedBy: req.user.id,
    alias: xss(req.body.alias),
    name: xss(req.body.name),
    description: xss(req.body.description),
    country: xss(req.body.country),
    uploadedAt,
    lastPlayed: uploadedAt,
    error: 0,
    reported: 0,
  };

  if (req.files && !req.body.url) { // will not exist if file too large
    const fileName = `${req.user.id}_${req.body.name}_${uploadedAt}`;
    const file = req.files.file;
    let extension;

    const ticks = [];
    if (req.body.ticks) {
      const pairs = req.body.ticks.split('\r\n');
      pairs.forEach((element) => {
        const elems = element.split(' ');
        if (elems.length === 2 && elems[0] < elems[1]) { // start tick less than end tick
          ticks.push({start: elems[0], end: elems[1]});
        }
      });
    }

    // check the type of file uploaded
    if (file.mimetype === 'application/octet-stream') { // demos are a hex file
      extension = 'dem';
      document.type = 'demo';
      document.ticks = ticks;
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
  } else if (req.body.url && !req.files) { // url uploading
    // valid url
    try {
      const url = new URL(req.body.url.trim());
      // valid twitch or youtube url
      if (url.host === 'www.youtube.com'
            || url.host === 'youtube.com'
            || url.host === 'youtu.be'
            || url.host === 'clips.twitch.tv') {
        let code;
        if (url.host === 'clips.twitch.tv') {
          document.error = 1; // twitch clips currently dont work so do this for now
          code = url.pathname.substr(1, url.pathname.length).split('/')[0];
        } else { // must be youtube
          if (url.host === 'youtu.be') {
            code = url.pathname.substr(1, url.pathname.length).split('/')[0];
          } else {
            code = url.searchParams.get('v'); // extract the video id from the provided url (could be lots of different things)
          }
        }

        if (!code) { // no code found
          return utils.renderError(req, res, 400, 'Not a valid Twitch or YouTube URL');
        }

        db.getDb().collection('clips').findOne({code}, (err, result) => { // check to see the clip exists already
          if (err) {
            return utils.renderError(req, res, 500, 'Could not save URL, contact developer for more');
          }
          if (result) {
            return utils.renderError(req, res, 400, 'URL already saved!');
          }
          document.type = 'url';
          document.url = xss(url.href);
          document.code = xss(code);

          // upload clip to db
          db.getDb().collection('clips').insertOne(document, (err, result) => { // insert in db
            if (err) {
              utils.log('error', err);
              return utils.renderError(req, res, 500, 'Failed to save URL, contact developer for more');
            } else {
              return res.redirect('/manage/upload');
            }
          });
        });
      } else {
        return utils.renderError(req, res, 400, 'Not a valid Twitch or YouTube URL');
      }
    } catch (error) {
      return utils.renderError(req, res, 400, 'Invalid URL');
    }
  } else {
    return utils.renderError(req, res, 400, 'Bad Request');
  }
});

module.exports = router;
