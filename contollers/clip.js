const mongo = require('mongodb');

const db = require('../src/db');

/**
 * Gets all the clips from the database with the specified body
 * @param {object} body the db query
 * @param {object} sort the db sort
 * @param {object} projection which feilds are to be included in the result
 * @param {Number} limit the limit to the number of clips to get
 * @return {Promise}
 */
const getAll = (body, sort, projection, limit) => {
  limit = limit | 0;
  if (!projection) projection = {};
  return db.getDb().collection('clips').find(body).project(projection).sort(sort).limit(limit).toArray();
};

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
const getOne = (_id, sort) => new Promise((resolve, reject) => {
  db.getDb().collection('clips').find({_id: new mongo.ObjectId(_id)}).sort(sort).limit(1).toArray().then((output) => {
    resolve(output[0]);
  }).catch((error) => {
    reject(error);
  });
});

/**
 * Search for clips (db.clips.createIndex({name:'text', description:'text'}))
 * @param {String} query the query to search for
 * @param {Object} projection the projection to put on the result
 * @param {Number} limit the max documents to return
 * @return {Promise}
 */
const search = (query, projection, limit) => db.getDb().collection('clips').find({error: 0, reported: 0, $text: {$search: `\"${query}\"`, $caseSensitive: false}}).project(projection).limit(limit).toArray();


/**
 * Get the clip based on the code field
 * @param {string} code the code of the clip
 * @return {Promise}
 */
const getOneByCode = (code) => new Promise((resolve, reject) => {
  db.getDb().collection('clips').find({code}).limit(1).toArray().then((output) => {
    resolve(output[0]);
  }).catch((error) => {
    reject(error);
  });
});

/**
 * Get the clip based on the url provided
 * @param {string} url the code of the clip
 * @return {Promise}
 */
const getOneByURL = (url) => new Promise((resolve, reject) => {
  db.getDb().collection('clips').find({url}).limit(1).toArray().then((output) => {
    resolve(output[0]);
  }).catch((error) => {
    reject(error);
  });
});

/**
 * Get the number of documents that match the query
 * @param {*} body the db query
 * @return {Promise}
 */
const getCount = (body) => db.getDb().collection('clips').countDocuments(body);

/**
 * Add a new clip to the db
 * @param {object} body clip to add
 * @return {Promise}
 */
const addOne = (body) => new Promise((resolve, reject) => {
  db.getDb().collection('clips').insertOne(body).then((output) => {
    resolve(output.result);
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
const updateOne = (_id, body) => new Promise((resolve, reject) => {
  db.getDb().collection('clips').updateOne({_id: new mongo.ObjectID(_id)}, {$set: body}).then((output) => {
    resolve(output.result);
  }).catch((error) => {
    reject(error);
  });
});

/**
 * Update multiple clips
 * @param {object} where db query
 * @param {object} body body of the document to set
 * @return {Promise}
 */
const updateMany = (where, body) => new Promise((resolve, reject) => {
  db.getDb().collection('clips').updateMany(where, {$set: body}).then((output) => {
    resolve(output.result);
  }).catch((error) => {
    reject(error);
  });
});

/**
 * Delete a clip from the db
 * @param {string} _id the id to delete
 * @return {Promise}
 */
const deleteOne = (_id) => new Promise((resolve, reject) => {
  db.getDb().collection('clips').deleteOne({_id: new mongo.ObjectId(_id)}).then((output) => {
    resolve(output.result);
  }).catch((error) => {
    reject(error);
  });
});

module.exports = {
  getAll,
  getAllByUser,
  search,
  getOne,
  getOneByCode,
  getOneByURL,
  getCount,
  addOne,
  updateOne,
  updateMany,
  deleteOne,
};
