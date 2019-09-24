const db = require('../src/db');

/**
 * Check to see if the video is blacklisted
 * @param {string} code the video code to check
 * @return {Promise}
 */
const isClipBlacklisted = (code) => new Promise((resolve, reject) => {
  // check if the clip is blacklisted because of yt/twitch channel exceptions
  db.getDb().collection('blacklistedClips').find({code}).limit(1).toArray().then((output) => {
    if (output[0]) {
      resolve(true);
    } else {
      resolve(false);
    }
  }).catch((error) => {
    reject(error);
  });
});

/**
 * Check to see if the user is blacklisted
 * @param {Number} userId user id to check
 * @return {Promise}
 */
const isUserBlacklisted = (userId) => new Promise((resolve, reject) => {
  // check if the clip is blacklisted because of yt/twitch channel exceptions
  db.getDb().collection('blacklistedUsers').find({userId}).limit(1).toArray().then((output) => {
    if (output[0]) {
      resolve(true);
    } else {
      resolve(false);
    }
  }).catch((error) => {
    reject(error);
  });
});

module.exports = {
  isClipBlacklisted,
  isUserBlacklisted,
};
