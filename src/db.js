const config = require('config');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;

let db;

module.exports = {
  connectToServer: (callback) => {
    MongoClient.connect(process.env.DB_URL || config.get('db.url'), {useNewUrlParser: true, useUnifiedTopology: true}, (error, client ) => {
      db = client.db(config.get('db.database'));
      return callback(error);
    });
  },

  /**
   * @return {mongo.Db} db
   */
  getDb: () => db,
};
