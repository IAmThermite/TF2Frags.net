const router = require('express').Router();

const utils = require('../src/utils');

const ClipController = require('../contollers/clip');

router.get('/', (req, res) => {
  if (req.query.limit && (Number.isNaN(Number.parseInt(req.query.limit)) || Number.parseInt(req.query.limit) < 0)) {
    return utils.renderError(req, res, 400, 'Limit parameter must be >= 0');
  }

  // does the parameter have a value, if so use it
  const limit = req.query.limit ? Number.parseInt(req.query.limit) : 0;
  // latest first
  // only return name, url, order and when they were last played
  ClipController.getAll({error: 0, reported: 0}, {uploadedAt: -1}, {}, limit).then((output) => {
    return utils.render(req, res, 'clips', 'All Clips', {clips: output, header: 'All Clips'});
  }).catch((error) => {
    utils.log('error', error);
    return utils.renderError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.get('/current', (req, res) => {
  ClipController.getCurrent().then((output) => {
    return utils.render(req, res, 'clip', 'Current Clip', {clip: output});
  }).catch((error) => {
    utils.log('error', error);
    return utils.renderError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.get('/previous', (req, res) => {
  ClipController.getPrevious().then((output) => {
    return utils.render(req, res, 'clip', 'Previous Clip', {clip: output});
  }).catch((error) => {
    utils.log('error', error);
    return utils.renderError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.get('/queue', (req, res) => {
  if (req.query.limit && (Number.isNaN(Number.parseInt(req.query.limit)) || Number.parseInt(req.query.limit) < 0)) {
    return utils.renderError(req, res, 400, 'Limit parameter must be >= 0');
  }

  // does the parameter have a value, if so use it
  const limit = req.query.limit ? Number.parseInt(req.query.limit) : 50;
  ClipController.getQueue(limit).then((output) => {
    return utils.render(req, res, 'clips', 'Queue', {clips: output, header: 'Queue'});
  }).catch((error) => {
    utils.log('error', error);
    return utils.renderError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.get('/error', utils.ensureAuthenticated, utils.requireAdmin, (req, res) => {
  ClipController.getAll({error: 1}).then((output) => {
    return utils.render(req, res, 'clips', 'Errored Clips', {clips: output, header: 'Errored'});
  }).catch((error) => {
    utils.log('error', error);
    return utils.renderError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.get('/reported', utils.ensureAuthenticated, utils.requireAdmin, (req, res) => {
  ClipController.getAll({reported: 1}).then((output) => {
    return utils.render(req, res, 'clips', 'Reported Clips', {clips: output, header: 'Reported'});
  }).catch((error) => {
    utils.log('error', error);
    return utils.renderError(req, res, 500, 'Internal server error, contact developer');
  });
});

router.get('/:code', (req, res) => {
  ClipController.getOneByCode(req.params.code).then((output) => {
    if (output) {
      return utils.render(req, res, 'clip', `Clip ${output.name}`, {clip: output});
    }
    return utils.renderError(req, res, 404, 'Clip not found!');
  }).catch((error) => {
    utils.log('error', error);
    return utils.renderError(req, res, 500, 'Internal server error, contact developer');
  });
});

module.exports = router;
