const config = require('config');

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
    // Does the directory exist?
    if (!fs.existsSync(`${config.get('app.fileLocation')}/${userId}`)) {
      fs.mkdirSync(`${config.get('app.fileLocation')}/${userId}`);
    }

    // Move file
    file.mv(`${config.get('app.fileLocation')}/${userId}/${fileName}.${extension}`, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  }),
};
