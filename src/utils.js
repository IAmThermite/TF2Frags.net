const config = require('config');
// const fs = require('fs');
const AWS = require('aws-sdk');

AWS.config.update({region: 'us-west-2'});

const s3 = new AWS.S3({accessKeyId: config.get('aws.keyId'), secretAccessKey: config.get('aws.keySecret')});

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

  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      return res.redirect('/auth/steam');
    }
  },

  log: (level, message) => {
    console.log(`${level.toUpperCase()} | ${message}`);
  },

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
};
