const xss = require('xss');
const router = require('express').Router();

const utils = require('../src/utils');

const ClipController = require('../contollers/clip');

router.get('/', (req, res) => {
  res.send({});
});

router.get('/clips', (req, res) => {
  // latest first
  // only return name, url, order and when they were last played
  ClipController.getAll({type: 'url'}, {uploadedAt: -1}, {_id: 0, name: 1, url: 1, order: 1, lastPlayed: 1}).then((output) => {
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
  const limit = req.query.limit ? Number.parseInt(req.query.limit) : 50;
  ClipController.getQueue(limit, {name: 1, url: 1, lastPlayed: 1}).then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Failed to get queue');
  });
});

router.get('/clips/randomise', utils.validApiKey, (req, res) => {
  utils.log('info', 'Randomise clips called');
  ClipController.randomise().then((output) => {
    return res.send({updated: true});
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

router.get('/clips/:_id', (req, res) => {
  ClipController.getOne(req.params._id).then((output) => {
    return res.send(output[0]);
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.post('/clips/next', utils.validApiKey, (req, res) => {
  const lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  ClipController.getCurrent().then((output) => {
    // order number needs to be greater than number of clips
    const order = output.order + Math.floor(Math.random() * 1000) + 1000; // add at least 1000 to the order (between 1000 and 2099)
    return ClipController.updateOne(output._id, {order, lastPlayed});
  }).then((output) => {
    utils.log('info', `Next clip called: ${JSON.stringify(output.result)}`);
    return ClipController.updateToNextClip();
  }).then((output) => {
    return ClipController.setCurrent(output);
  }).then((output) => {
    return res.send({next: true});
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

      ClipController.getOneByCode(code).then((output) => {
        if (output[0]) {
          return utils.sendError(req, res, 400, 'URL already saved!');
        } else {
          document.type = 'url';
          document.url = xss(url.href);
          document.code = xss(code);
          ClipController.getPrevious().then((output) => {
            document.order = req.body.order || output.order + 1; // if order is included in the body then use that
            return ClipController.addOne(document);
          }).then((output) => {
            utils.log('info', `Clip ${document.url} uploaded by ${document.uploadedBy}`);
            return res.send({added: true});
          }).catch((error) => {
            utils.log('error', error);
            return utils.sendError(req, res, 500, 'Could not save URL, contact developer for more');
          });
        }
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

router.post('/clips/:_id', utils.validApiKey, (req, res) => {
  const lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  const error = req.body.error | 0;
  const reported = req.body.reported | 0;
  ClipController.updateOne(req.params._id, {lastPlayed, error, reported}).then((output) => {
    utils.log('info', `Clip ${req.params._id} updated: ${JSON.stringify(output.result)}`);
    return res.send({updated: true});
  }).catch((error) => {
    utils.log('error', error);
    return utils.sendError(req, res, 500, 'Error updating clip');
  });
});

module.exports = router;
