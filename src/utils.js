const config = require('config');
// const fs = require('fs');
const AWS = require('aws-sdk');
const mongo = require('mongodb');

const db = require('./db');

AWS.config.update({region: 'us-west-2'});

const s3 = new AWS.S3({accessKeyId: config.get('aws.keyId'), secretAccessKey: config.get('aws.keySecret')});

let currentClip = undefined;
let previousClip = undefined;

const log = (level, message) => {
  console.log(`${level.toUpperCase()} | ${message}`);
};

const getCurrentClip = () => new Promise((resolve, reject) => {
  if (!currentClip) {
    db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({order: 1, lastPlayed: 1, uploadedAt: 1}).limit(1).toArray().then((output) => {
      currentClip = output[0];
      resolve(currentClip);
    }).catch((error) => {
      reject(error);
    });
  } else {
    // is current clip still ok?
    db.getDb().collection('clips').find({_id: new mongo.ObjectID(currentClip._id), error: 0, reported: 0}).limit(1).toArray().then((output) => {
      if (output[0]) {
        resolve(currentClip);
      } else {
        // update current clip
        db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({order: 1, lastPlayed: 1, uploadedAt: 1}).limit(1).toArray().then((output) => {
          currentClip = output[0];
          resolve(currentClip);
        }).catch((error) => {
          reject(error);
        });
      }
    }).catch((error) => {
      reject(error);
    });
  }
});

const getPreviousClip = () => new Promise((resolve, reject) => {
  if (!previousClip) {
    db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({order: -1, lastPlayed: -1, uploadedAt: 1}).limit(1).toArray().then((output) => {
      previousClip = output[0];
      resolve(previousClip);
    }).catch((error) => {
      reject(error);
    });
  } else {
    resolve(previousClip);
  }
});

module.exports = {
  render: (req, res, page, title, data) => {
    return res.render('template', {
      title,
      page,
      user: req.user,
      data,
    });
  },

  renderError: (req, res, code, message) => {
    res.status(code);
    return res.render('template', {title: 'error', user: req.user, page: 'error', code, message});
  },

  sendError: (req, res, code, message) => {
    res.status(code);
    return res.send({error: {code, message}});
  },

  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      return res.redirect('/auth/steam');
    }
  },

  log,

  saveFile: (userId, file, fileName, extension) => new Promise((resolve, reject) => {
    // Save file locally
    // does the directory exist?
    // if (!fs.existsSync(`${config.get('app.fileLocation')}/${userId}`)) {
    //   fs.mkdirSync(`${config.get('app.fileLocation')}/${userId}`);
    // }
    // file.mv(`${config.get('app.fileLocation')}/${userId}/${fileName}.${extension}`, (err) => {
    //   if (err) {
    //     reject(err);
    //   } else {
    //     resolve();
    //   }
    // });

    // Save file to AWS S3
    const params = {Bucket: config.get('aws.bucketName'), Key: `clips/${userId}/${fileName}.${extension}`, Body: file.data};
    s3.upload(params).promise().then((data) => {
      resolve(data);
    }).catch((error) => {
      reject(error);
    });
  }),

  deleteFile: (userId, fileName) => new Promise((resolve, reject) => {
    s3.deleteObject({Bucket: config.get('aws.bucketName'), Key: `clips/${userId}/${fileName}`}).promise().then((data) => {
      resolve(data);
    }).catch((error) => {
      reject(error);
    });
  }),

  setCurrentClip: (clip) => {
    currentClip = clip;
  },

  getCurrentClip: getCurrentClip,

  getPreviousClip: getPreviousClip,

  updateToNextClip: () => new Promise((resolve, reject) => {
    getCurrentClip().then((output) => {
      previousClip = currentClip;
      currentClip = output[0];
      while (output.code !== previousClip.code) {
        db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({order: 1, lastPlayed: 1, uploadedAt: 1}).limit(1).toArray().then((output) => {
          currentClip = output[0];
        }).catch((error) => {
          reject(error);
          return;
        });
      }
      resolve(output[0]);
    }).catch((error) => {
      reject(error);
    });
  }),

  validApiKey: (req, res, next) => {
    if (!req.header('authorization')) {
      res.status(401);
      return res.send({error: {code: 401, message: 'Unauthorized to use this resource'}});
    }
    db.getDb().collection('apiKeys').find({key: req.header('authorization')}).limit(1).toArray().then((output) => {
      if (output[0]) {
        next();
      } else {
        res.status(403);
        return res.send({error: {code: 403, message: 'Invalid credentials'}});
      }
    }).catch((error) => {
      log('error', error);
      res.status(500);
      return res.send({error: {code: 500, message: 'Something went wrong, contact developer'}});
    });
  },

  requireAdmin: (req, res, next) => {
    next();
  },
};
