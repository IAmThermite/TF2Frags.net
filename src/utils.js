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
    return res.render('error', {code, message});
  },

  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      return res.redirect('/auth/steam');
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
      return res.render('error', {code: 403, message: 'Bugger off, this is my toy!'});
    }
  },

  log: (level, message) => {
    console.log(`${level.toUpperCase()} | ${message}`);
  },
};
