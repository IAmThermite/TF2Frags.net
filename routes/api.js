const mongo = require('mongodb');
const router = require('express').Router();

const utils = require('../src/utils');
const db = require('../src/db');

router.get('/', (req, res) => {
  res.send({});
});

router.get('/clips', (req, res) => {
  // latest first
  // only return name, url, order and when they were last played
  db.getDb().collection('clips').find({type: 'url'}).project({_id: 0, name: 1, url: 1, order: 1, lastPlayed: 1}).sort({uploadedAt: -1}).toArray().then((output) => {
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
    res.status(500);
    return res.send({error: {code: 500, message: 'Could not get curent clip'}});
  });
});

router.get('/clips/previous', (req, res) => {
  utils.getPreviousClip().then((output) => {
    res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    res.status(500);
    return res.send({error: {code: 500, message: 'Could not get previous clip'}});
  });
});

router.get('/clips/queue', (req, res) => {
  const limit = req.query.limit || 50;
  if (limit < 0) {
    res.status(400);
    return res.send({error: {code: 400, message: 'Limit parameter must be >= 0'}});
  }
  db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({order: 1, lastPlayed: 1, uploadedAt: 1}).project({_id: 0, name: 1, url: 1, lastPlayed: 1, order: 1}).limit(limit).toArray().then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    res.status(500);
    return res.send({error: {code: 500, message: 'Could not get queue'}});
  });
});

router.get('/clips/:_id', (req, res) => {
  db.getDb().collection('clips').find({_id: new mongo.ObjectID(req.params._id)}).limit(1).toArray().then((output) => {
    return res.send(output[0]);
  }).catch((error) => {
    utils.log('error', error);
    res.status(500);
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

router.get('/clips/randomise', utils.validApiKey, (req, res) => {
  utils.log('info', 'Randomise clips called');
  db.getDb().collection('clips').find({}).toArray().then((output) => {
    output.forEach((clip) => {
      // randomise order (1-100)
      db.getDb().collection('clips').updateOne({_id: new mongo.ObjectID(clip._id)}, {$set: {order: Math.floor(Math.random() * 100) + 1}}).catch((err) => {
        utils.log('error', err);
        return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
      });
    });
    return res.send({updated: true});
  }).catch((error) => {
    utils.log('error', error);
    res.status(500);
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

router.get('/clips/error', utils.validApiKey, (req, res) => {
  db.getDb().collection('clips').find({error: 1}).toArray().then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    res.status(500);
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

router.get('/clips/reported', utils.validApiKey, (req, res) => {
  db.getDb().collection('clips').find({reported: 1}).toArray().then((output) => {
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    res.status(500);
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

router.post('/clips/next', utils.validApiKey, (req, res) => {
  const lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  utils.getCurrentClip().then((output) => {
    // order number needs to be greater than number of clips
    const order = output.order + Math.floor(Math.random() * 1000) + 1000; // add at least 1000 to the order (between 1000 and 2099)
    return db.getDb().collection('clips').updateOne({'_id': new mongo.ObjectID(output._id)}, {$set: {order, lastPlayed}});
  }).then((output) => {
    utils.log('info', `Next clip called: ${JSON.stringify(output.result)}`);
    return utils.updateToNextClip();
  }).then((output) => {
    utils.setCurrentClip(output);
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    res.status(500);
    return res.send({error: {code: 500, message: 'Internal server error, contact developer'}});
  });
});

router.post('/clips', utils.validApiKey, (req, res) => {
  const lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  const document = {
    uploadedBy: req.body.uplodaedBy,
    name: req.body.name,
    alias: '',
    description: '',
    country: '',
    uploadedAt: lastPlayed,
    lastPlayed,
    error: 0,
    reported: 0,
    type: 'url',
    url: req.body.url,
    code: req.body.code,
    order: req.body.order,
  };
  db.collection('clips').find({code: req.body.code}).limit(1).toArray().then((output) => {
    if (output[0]) {
      res.status(400);
      return res.send({error: {code: 400, message: 'Clip already exists'}});
    }
  }).catch((error) => {
    utils.log('error', error);
    res.status(500);
    return res.send({error: {code: 500, message: 'Error inserting clip'}});
  });
  db.getDb().collection('clips').insertOne(document).then((output) => {
    utils.log('info', `Clip ${document.url} uploaded by ${document.uploadedBy}`);
    return res.send(output);
  }).catch((error) => {
    utils.log('error', error);
    res.status(500);
    return res.send({error: {code: 500, message: 'Error inserting clip'}});
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
    res.status(500);
    return res.send({error: {code: 500, message: 'Error updating clip.'}});
  });
});

module.exports = router;
