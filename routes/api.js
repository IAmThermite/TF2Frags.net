const config = require('config');
const router = require('express').Router();

const utils = require('../src/utils');
const db = require('../src/db');

router.get('/', (req, res) => {

});

router.get('/clips/count', (req, res) => {
  db.getDb().collection('clips').countDocuments({error: 0, reported: 0}).then((output) => {
    return res.send({count: output});
  }).catch((error) => {
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

router.get('/clips/:type', (req, res) => {
  db.getDb().collection('clips').find({type: req.params.type, error: 0, reported: 0}).project({name: 1, url: 1, lastPlayed: 1, _id: 0}).toArray().then((output) => {
    return res.send(output);
  }).catch((error) => {
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

router.get('/clips/current', (req, res) => {
  return res.send(utils.getCurrentClip());
});

router.get('/clips', utils.validApiKey, (req, res) => {
  db.getDb().collection('clips').find({error: 0, reported: 0}).project({name: 1, url: 1, lastPlayed: 1, fileName: 1, _id: 0}).toArray().then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

// requires api auth
router.get('/clips/next', utils.validApiKey, (req, res) => {
  const lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  db.collection('clips').updateOne({'_id': new mongo.ObjectID(req.body._id)}, {$set: {lastPlayed}}).then((output) => {
    utils.log('info', `Next video called: ${JSON.stringify(output.result)}`);
    utils.getNextClip().then((output) => {
      utils.setCurrentClip(output);
      res.send(output);
    }).catch((error) => {
      utils.log('error', error);
      return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
    });
  }).catch((error) => {
    utils.log('error', error);
    return res.send({error: {code: 500, message: 'Error updating clip.'}});
  });
});

// requires api auth
router.post('/clips/:id', utils.validApiKey, (req, res) => {
  const lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  const error = req.body.error | 0;
  const reported = req.body.reported | 0;
  db.collection('clips').updateOne({'_id': new mongo.ObjectID(req.params._id)}, {$set: {lastPlayed, error, reported}}).then((output) => {
    utils.log('info', `Video ${req.params.id} updated: ${JSON.stringify(output.result)}`);
    return res.send(output.result);
  }).catch((error) => {
    utils.log('error', error);
    return res.send({error: {code: 500, message: 'Error updating clip.'}});
  });
});

module.exports = router;
