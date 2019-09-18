const mongo = require('mongodb');

const utils = require('../src/utils');
const db = require('../src/db');

let currentClip = undefined;
let previousClip = undefined;

/**
 * Gets all the clips from the database with the specified body
 * @param {object} body the db query
 * @param {object} sort the db sort
 * @param {object} projection which feilds are to be included in the result
 * @param {Number} limit the limit to the number of clips to get
 * @return {Promise}
 */
const getAll = (body, sort, projection, limit) => db.getDb().collection('clips').find(body).project(projection).sort(sort).limit(limit).toArray();

/**
 * Gets all the clips uploaded by a specific user
 * @param {number} userId the id of the user
 * @return {Promise}
 */
const getAllByUser = (userId) => db.getDb().collection('clips').find({uploadedBy: userId}).toArray();

/**
 * Get the specified clip
 * @param {string}_id the id of the clip
 * @param {object} sort the db sort
 * @param {object} projection which feilds are to be included in the result
 * @return {Promise}
 */
const getOne = (_id, sort, projection) => db.getDb().collection('clips').find({_id: new mongo.ObjectId(_id)}).project(projection).sort(sort).limit(1).toArray();

/**
 * Get the clip based on the code field
 * @param {string} code the code of the clip
 * @return {Promise}
 */
const getOneByCode = (code) => db.getDb().collection('clips').find({code}).limit(1).toArray();

/**
 * Get the clip based on the url provided
 * @param {string} url the code of the clip
 * @return {Promise}
 */
const getOneByURL = (url) => db.getDb().collection('clips').find({url}).limit(1).toArray();

/**
 * Get the number of documents that match the query
 * @param {*} body the db query
 * @return {Promise}
 */
const getCount = (body) => db.getDb().collection('clips').countDocuments(body);

/**
 * Get the clip that is the top of the list in terms of order and last played
 * @return {Promise}
 */
const getNext = () => db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({order: 1, lastPlayed: 1, uploadedAt: 1}).limit(1).toArray();

/**
 * Get the current cached clip. Will check to see if it is still valid and caches it when it is invalid
 * @return {Promise}
 */
const getCurrent = () => new Promise((resolve, reject) => {
  if (!currentClip) {
    getNext().then((output) => {
      currentClip = output[0];
      resolve(currentClip);
    }).catch((error) => {
      reject(error);
    });
  } else {
    // is current clip still ok?
    db.getDb().collection('clips').find({_id: new mongo.ObjectID(currentClip._id), error: 0, reported: 0}).project({_id: 0}).limit(1).toArray().then((output) => {
      if (output[0]) {
        resolve(currentClip);
      } else {
        // update current clip
        db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({order: 1, lastPlayed: 1, uploadedAt: 1}).project({_id: 0}).limit(1).toArray().then((output) => {
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

/**
 * Set the current clip cached clip
 * @param {object} clip clip to cache
 */
const setCurrent = (clip) => {
  currentClip = clip;
};

/**
 * Get the previous cached clip
 * @return {{Promise}}
 */
const getPrevious = () => new Promise((resolve, reject) => {
  if (!previousClip) {
    db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({order: -1, lastPlayed: -1, uploadedAt: 1}).project({_id: 0}).limit(1).toArray().then((output) => {
      previousClip = output[0];
      resolve(previousClip);
    }).catch((error) => {
      reject(error);
    });
  } else {
    resolve(previousClip);
  }
});

/**
 * Get the clips that are in the queue
 * @param {Number} limit the number to get from the queue
 * @param {object} projection the db projection
 * @return {Promise}
 */
const getQueue = (limit, projection) => {
  if (!projection) projection = {};
  projection._id = 0;
  return db.getDb().collection('clips').find({type: 'url', error: 0, reported: 0}).sort({order: 1, lastPlayed: 1, uploadedAt: 1}).project(projection).limit(limit || 50).toArray();
};

/**
 * Randomise the order of the clips
 * @return {Promise}
 */
const randomise = () => new Promise((resolve, reject) => {
  db.getDb().collection('clips').find({}).toArray().then((output) => {
    output.forEach((clip) => {
      // randomise order (1-100)
      db.getDb().collection('clips').updateOne({_id: new mongo.ObjectID(clip._id)}, {$set: {order: Math.floor(Math.random() * 100) + 1}}).catch((err) => {
        utils.log('error', err);
        reject(error);
      });
    });
    resolve({updated: true});
  }).catch((error) => {
    utils.log('error', error);
    reject(error);
  });
});

/**
 * Add a new clip to the db
 * @param {object} body clip to add
 * @return {Promise}
 */
const addOne = (body) => new Promise((resolve, reject) => {
  db.getDb().collection('clips').insertOne(body).then((output) => {
    resolve(output);
  }).catch((error) => {
    reject(error);
  });
});

/**
 * Update the current clip as having been played, update the two cached clips
 * @return {Promise}
 */
const updateToNextClip = () => new Promise((resolve, reject) => {
  const lastPlayed = new Date().toLocaleString().replace(/\//g, '-').replace(', ', '-');
  const order = currentClip.order + Math.floor(Math.random() * 1000) + 1000; // add at least 1000 to the order (between 1000 and 2099)
  // update current clip
  getCurrent().then((output) => {
    return updateOne(output._id, {order, lastPlayed});
  }).then((output) => {
    // get next clip direct from db
    return getNext();
  }).then((output) => {
    // update clip variables
    previousClip = currentClip;
    currentClip = output[0];
    resolve(output[0]);
  }).catch((error) => {
    reject(error);
  });
});

/**
 * Update the clip with the specified id
 * @param {string} _id the id of the clip to update
 * @param {object} body the body of the document to set
 * @return {Promise}
 */
const updateOne = (_id, body) => db.getDb().collection('clips').updateOne({_id: new mongo.ObjectID(_id)}, {$set: body});

/**
 * Update multiple clips
 * @param {object} where db query
 * @param {object} body body of the document to set
 * @return {Promise}
 */
const updateMany = (where, body) => db.getDb().collection('clips').updateMany(where, {$set: body});

/**
 * Delete a clip from the db
 * @param {string} _id the id to delete
 * @return {Promise}
 */
const deleteOne = (_id) => db.getDb().collection('clips').deleteOne({_id});

module.exports = {
  getAll,
  getAllByUser,
  getOne,
  getOneByCode,
  getOneByURL,
  getCount,
  getNext,
  getCurrent,
  setCurrent,
  getPrevious,
  getQueue,
  randomise,
  addOne,
  updateToNextClip,
  updateOne,
  updateMany,
  deleteOne,
};
