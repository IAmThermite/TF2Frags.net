const xss = require('xss');
const config = require('config');
const request = require('request');
const router = require('express').Router();

const utils = require('../src/utils');

const ClipController = require('../contollers/clip');
const BlacklistController = require('../contollers/blacklist');

router.get('/', utils.ensureAuthenticated, (req, res) => {
  // get clips owned by user
  ClipController.getAllByUser(req.user.id).then((output) => {
    return utils.render(req, res, 'manage', 'Manage Clips', {clips: output});
  }).catch((error) => {
    utils.log('error', error);
    return utils.renderError(req, res, 500, 'Could not get your clips!');
  });
});

router.get('/upload', utils.ensureAuthenticated, (req, res) => {
  return utils.render(req, res, 'upload', 'Upload', {key: config.get('recaptcha.siteKey')});
});

router.get('/delete/:id', utils.ensureAuthenticated, (req, res) => {
  ClipController.getOne(req.params.id).then((output) => {
    if (!output) return utils.renderError(req, res, 404, 'Could not find clip');

    if (output.uploadedBy === req.user.id) {
      ClipController.deleteOne(req.params.id).then(() => { // delete from storage
        if (output.fileName) {
          utils.deleteFile(output.uploadedBy, output.fileName).catch((error) => {
            utils.log('error', error);
            return utils.renderError(req, res, 500, 'Failed to delete clip, contact developer for more.');
          });
        }
        return res.redirect('/manage');
      }).catch((error) => {
        utils.log('error', error);
        return utils.renderError(req, res, 500, 'Failed to delete clip, contact developer for more.');
      });
    } else {
      return utils.renderError(req, res, 404, 'Could not find clip');
    }
  });
});

router.post('/upload', utils.ensureAuthenticated, (req, res) => {
  if (!req.body['g-recaptcha-response']) {
    return res.send('Please veryify that you are not a BOT');
  }
  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${config.get('recaptcha.secretKey')}&response=${req.body['g-recaptcha-response']}&remoteip=${req.connection.remoteAddress}}`;

  request(verificationUrl, (error, response, body) => {
    body = JSON.parse(body);
    if (!body.success) {
      utils.log('error', error);
      utils.log('error', response);
      return res.send('VERIFICATION FAILED');
    }
  });

  BlacklistController.isUserBlacklisted(req.user.id).then((output) => {
    if (output) {
      return utils.renderError(req, res, 403, 'Not allowed to upload.');
    }
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
      order: ClipController.order + 25 - Math.ceil(Math.random(50)), // +/- 25 is safe
    };

    if (req.files && !req.body.url) { // will not exist if file too large
      const fileName = `${req.user.id}_${req.body.name}_${uploadedAt}`;
      const file = req.files.file;
      let extension;

      // check the type of file uploaded
      if (file.mimetype === 'application/octet-stream') { // demos are a hex file
        extension = 'dem';
        document.type = 'demo';
        const ticks = [];
        if (req.body.ticks) {
          const pairs = req.body.ticks.split('\r\n');
          pairs.forEach((element) => {
            const elems = element.split(' ');
            if (elems.length === 2 && elems[0] < elems[1]) { // start tick less than end tick
              ticks.push({start: elems[0], end: elems[1]});
            }
          });
        } else { // no ticks
          return utils.renderError(req, res, 400, 'Please include tick');
        }
        document.ticks = ticks; // probably should do some validation here
      } else if (file.mimetype.startsWith('video/')) { // videos
        extension = file.name.substring(file.name.lastIndexOf('.'), file.name.length); // file extension
        document.type = 'video';
      } else {
        return utils.renderError(req, res, 400, 'File type invalid. Please upload a demo or a video');
      }

      document.fileName = `${fileName}.${extension}`;

      // save to db
      ClipController.addOne(document).then((data) => {
        // save the file
        utils.saveFile(req.user.id, file, fileName, extension).then(() => {
          return res.redirect('/manage/upload');
        }).catch((error) => {
          utils.log('error', error);
          return utils.renderError(req, res, 500, 'Failed to upload file, contact developer for more');
        });
      }).catch((error) => {
        utils.log('error', error);
        return utils.renderError(req, res, 500, 'Failed to save file, contact developer for more');
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

          BlacklistController.isClipBlacklisted(code).then((output) => {
            if (output) {
              return utils.renderError(req, res, 400, 'Upload not allowed');
            }
            return ClipController.getOneByCode(code);
          }).then((output) => { // check to see the clip exists already
            if (output) {
              return utils.renderError(req, res, 400, 'URL already saved!');
            }

            document.type = 'url';
            document.url = xss(url.href);
            document.code = xss(code);

            // upload clip to db
            ClipController.addOne(document).then((output) => {
              return res.redirect('/manage/upload');
            }).catch((error) => {
              utils.log('error', error);
              return utils.renderError(req, res, 500, 'Failed to save URL, contact developer for more');
            });
          }).catch((error) => {
            utils.log('error', error);
            return utils.renderError(req, res, 500, 'Could not save URL, contact developer for more');
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
  }).catch((error) => {
    utils.log('error', error);
    return utils.renderError(req, res, 500, 'Failed to load page, contact developer for more');
  });
});

module.exports = router;
