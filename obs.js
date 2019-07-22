const OBSWebSocket = require('obs-websocket-js');

const obs = new OBSWebSocket();

module.exports= {
  connect: () => obs.connect({
    address: process.env.OBS_URL,
    password: process.env.OBS_PASWORD,
  }),

  switchScene: (sceneName) => obs.send('SetCurrentScene', {'scene-name': sceneName}),
};

obs.on('error', (err) => {
  console.error('socket error:', err);
});
