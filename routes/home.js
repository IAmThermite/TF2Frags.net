const config = require('config');
const router = require('express').Router();

const ClipController = require('../contollers/clip');

const utils = require('../src/utils');

router.get('/', (req, res) => {
  ClipController.getAll({error: 0, reported: 0}, {uploadedAt: -1}, {}, 5).then((output) => {
    return utils.render(req, res, 'index', 'Home', {channel: config.get('twitch.channel'), clips: output});
  }).catch((error) => {
    return utils.render(req, res, 'index', 'Home', {channel: config.get('twitch.channel'), clips: []});
  });
});

router.get('/about', (req, res) => {
  return utils.render(req, res, 'about', 'About', {});
});

module.exports = router;
