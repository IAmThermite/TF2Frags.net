module.exports = {
  render: (req, res, page, title, data) => {
    res.render('template', {
      title,
      page,
      user: req.user,
      data,
    });
  },

  renderError: (req, res, code, message) => {
    res.status(code);
    res.render('error', {code, message});
  },

  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/auth/steam');
    }
  },

  canUserView: async (req, res, next) => {
    let authenticated = false;
    const allowed = process.env.ALLOWED_USERS.split(' ');
    await allowed.forEach((id) => {
      if (req.user.id === id) {
        authenticated = true;
        return;
      }
    });
    if (authenticated) {
      next();
    } else {
      res.status(403);
      res.render('error', {code: 403, message: 'Bugger off, this is my toy!'});
    }
  },

  log: (level, message) => {
    console.log(`${level} | ${message}`);
  },
};
