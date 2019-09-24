const xss = require('xss');
const router = require('express').Router();

const utils = require('../src/utils');

const ClipController = require('../contollers/clip');
const BlacklistController = require('../contollers/blacklist');

router.get('/', (req, res) => {
  res.send({});
});

router.use((req, res, next) => {
  res.header('Content-Type', 'application/json');
  next();
});

router.get('/clips', (req, res) => {
  if (req.query.limit && (Number.isNaN(Number.parseInt(req.query.limit)) || Number.parseInt(req.query.limit) < 0)) {
    res.status(400);
    return res.send({error: {code: 400, message: 'Limit parameter must be >= 0'}});
  }

  // does the parameter have a value, if so use it
  const limit = Number.isNaN(req.query.limit) ? 50: Number.parseInt(req.query.limit);
  // latest first
  // only return name, url, order and when they were last played
  ClipController.getAll({type: 'url'}, {uploadedAt: -1}, {_id: 0, name: 1, url: 1, order: 1, lastPlayed: 1}, limit).then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Failed to get all clips');
  });
});

router.get('/clips/count', (req, res) => {
  ClipController.getCount({type: 'url', error: 0, reported: 0}).then((output) => {
    return res.send({count: output});
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Could not retrieve clip count');
  });
});

router.get('/clips/current', (req, res) => {
  ClipController.getCurrent().then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Failed to get current clip');
  });
});

router.get('/clips/previous', (req, res) => {
  ClipController.getPrevious().then((output) => {
    res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Failed to get previous clip');
  });
});

router.get('/clips/queue', (req, res) => {
  if (req.query.limit && (Number.isNaN(Number.parseInt(req.query.limit)) || Number.parseInt(req.query.limit) < 0)) {
    res.status(400);
    return res.send({error: {code: 400, message: 'Limit parameter must be >= 0'}});
  }

  // does the parameter have a value, if so use it
  const limit = Number.isNaN(req.query.limit) ? 50: Number.parseInt(req.query.limit);
  ClipController.getQueue(limit, {name: 1, url: 1, lastPlayed: 1, order: 1}).then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Failed to get queue');
  });
});

router.get('/clips/randomise', utils.validApiKey, (req, res) => {
  utils.log('info', 'Randomise clips called');
  ClipController.randomise().then((output) => {
    return res.send({randomised: true});
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Failed to randomise clips');
  });
});

router.get('/clips/error', utils.validApiKey, (req, res) => {
  ClipController.getAll({error: 1}).then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.get('/clips/reported', utils.validApiKey, (req, res) => {
  ClipController.getAll({reported: 1}).then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.get('/clips/next', utils.validApiKey, (req, res) => {
  ClipController.updateToNextClip().then((output) => {
    utils.log('info', `Next clip called: ${JSON.stringify(output.code)}`);
    return res.send({next: true});
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.get('/clips/:code', (req, res) => {
  ClipController.getOneByCode(req.params.code).then((output) => {
    if (output) {
      return res.send(output);
    }
    return utils.sendError(req, res, 404, 'Not found');
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.post('/clips', utils.validApiKey, (req, res) => {
  const lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  const document = {
    uploadedBy: req.body.uploadedBy,
    name: req.body.name,
    alias: '',
    description: '',
    country: '',
    uploadedAt: lastPlayed,
    lastPlayed,
    error: 0,
    reported: 0,
    type: 'url',
  };
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
        return utils.sendError(req, res, 400, 'Not a valid Twitch or YouTube URL');
      }

      BlacklistController.isClipBlacklisted(code).then((output) => {
        if (output) {
          return utils.sendError(req, res, 400, 'Clip not allowed');
        }
        return ClipController.getOneByCode(code);
      }).then((output) => {
        if (output) {
          return utils.sendError(req, res, 400, 'URL already saved!');
        }
        document.type = 'url';
        document.url = xss(url.href);
        document.code = xss(code);
        document.order = Number.isNaN(req.body.order) ? ClipController.order + 1 : req.body.order; // if order is included in the body then use that
        return ClipController.addOne(document);
      }).then((output) => {
        utils.log('info', `Clip ${document.url} uploaded by ${document.uploadedBy}`);
        res.status(201);
        return res.send({added: true});
      }).catch((error) => {
        utils.log('error', error);
        return utils.sendError(req, res, 500, 'Could not save URL, contact developer for more');
      });
    } else {
      return utils.sendError(req, res, 400, 'Not a valid Twitch or YouTube URL');
    }
  } catch (error) {
    return utils.sendError(req, res, 400, 'Invalid URL');
  }
});

router.put('/clips/:_id', utils.validApiKey, (req, res) => {
  const document = {};
  document.lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  document.error = Number.isNaN(req.body.error) ? Number.parseInt(error) : 0;
  document.reported = Number.isNaN(req.body.reported) ? Number.parseInt(reported) : 0;

  if (!Number.isNaN(req.body.order)) {
    document.order = Number.parseInt(req.body.order);
  }

  ClipController.updateOne(req.params._id, document).then((output) => {
    utils.log('info', `Clip ${req.params._id} updated: ${JSON.stringify(output)}`);
    return res.send({updated: true});
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Error updating clip');
  });
});

module.exports = router;
