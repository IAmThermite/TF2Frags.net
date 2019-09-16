const config = require('config');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;

let db;

module.exports = {
  connectToServer: (callback) => {
    MongoClient.connect(config.get('db.url'), {useNewUrlParser: true, useUnifiedTopology: true}, ( err, client ) => {
      db = client.db(config.get('db.database'));
      return callback(err);
    });
  },

  /**
   * @return {mongo.Db} db
   */
  getDb: () => {
    return db;
  },
};
