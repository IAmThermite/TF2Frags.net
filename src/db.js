const config = require('config');
const MongoClient = require('mongodb').MongoClient;

let db;

module.exports = {
  connectToServer: (callback) => {
    MongoClient.connect(config.get('db.url'), {useNewUrlParser: true, useUnifiedTopology: true}, ( err, client ) => {
      db = client.db('tf2frags');
      return callback(err);
    } );
  },

  getDb: () => {
    return db;
  },
};
