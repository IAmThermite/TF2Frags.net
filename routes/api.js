const mongo = require('mongodb');
const router = require('express').Router();

const utils = require('../src/utils');
const db = require('../src/db');

router.get('/', (req, res) => {
  res.send({});
});

router.get('/clips', (req, res) => {
  db.getDb().collection('clips').find({}).toArray().then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

router.get('/clips/count', (req, res) => {
  db.getDb().collection('clips').countDocuments({error: 0, reported: 0}).then((output) => {
    return res.send({count: output});
  }).catch((error) => {
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

router.get('/clips/current', (req, res) => {
  utils.getCurrentClip().then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    res.send({error: {code: 500, message: 'Could not get curent clip'}});
  });
});

router.get('/clips/previous', (req, res) => {
  db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({lastPlayed: -1, uploadedAt: -1}).limit(1).toArray().then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return res.send({error: {code: 500, message: 'Could not get previous clip'}});
  });
});

router.get('/clips/queue', (req, res) => {
  db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({lastPlayed: 1, uploadedAt: 1}).project({_id: 0, name: 1, url: 1}).limit(20).toArray().then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    return res.send({error: {code: 500, message: 'Could not get queue'}});
  });
});

router.post('/clips/next', utils.validApiKey, (req, res) => {
  const lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  db.getDb().collection('clips').updateOne({'_id': new mongo.ObjectID(req.body._id)}, {$set: {lastPlayed}}).then((output) => {
    utils.log('info', `Next clip called: ${JSON.stringify(output.result)}`);
    utils.getNextClip('url').then((output) => { // remove url type when able
      utils.setCurrentClip(output);
      return res.send(output);
    }).catch((error) => {
      utils.log('error', error);
      return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
    });
  }).catch((error) => {
    utils.log('error', error);
    return res.send({error: {code: 500, message: 'Error updating clip.'}});
  });
});

router.get('/clips/:_id', utils.validApiKey, (req, res) => {
  db.getDb().collection('clips').find({_id: new mongo.ObjectId(req.params._id)}).limit(1).toArray().then((output) => {
    return res.send(output[0]);
  }).catch((error) => {
    utils.log('error', error);
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

router.post('/clips/:_id', utils.validApiKey, (req, res) => {
  const lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  const error = req.body.error | 0;
  const reported = req.body.reported | 0;
  db.getDb().collection('clips').updateOne({'_id': new mongo.ObjectID(req.params._id)}, {$set: {lastPlayed, error, reported}}).then((output) => {
    utils.log('info', `Clip ${req.params._id} updated: ${JSON.stringify(output.result)}`);
    return res.send(output.result);
  }).catch((error) => {
    utils.log('error', error);
    return res.send({error: {code: 500, message: 'Error updating clip.'}});
  });
});

module.exports = router;
