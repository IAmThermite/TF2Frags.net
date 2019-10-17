const chai = require('chai');
const chaiHttp = require('chai-http');

const ClipController = require('../../contollers/clip');

chai.use(chaiHttp);
chai.should();

const expect = chai.expect;
const assert = chai.assert;

const app = require('../../server');

const clips = [
  {
    url: 'https://youtu.be/CLIPNAME1',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
    order: -1,
  },
  {
    url: 'https://youtube.com/watch?v=CLIPNAME2',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
    order: -1,
  },
  {
    url: 'https://clips.twitch.tv/CLIPNAME3',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
    order: -1,
  },
  {
    url: 'https://youtu.be/CLIPNAME4',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
    order: -1,
  },
  {
    url: 'https://youtu.be/CLIPNAME5',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
    order: -1,
  },
  {
    url: 'https://youtu.be/CLIPNAME6',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
    order: -1,
  },
];

const requireAPIKey = (route) => {
  it('should return 401 without auth', () => {
    return chai.request(app).get(route).then((res) => {
      expect(res).to.have.status(401);
    }).catch((error) => {
      throw error;
    });
  });

  it('should return 403 with invalid auth', () => {
    return chai.request(app).get(route).set('Authorization', 'INVALID KEY HERE').then((res) => {
      expect(res).to.have.status(403);
    }).catch((error) => {
      throw error;
    });
  });

  it('should return 200 with valid auth', () => {
    return chai.request(app).get(route).set('Authorization', process.env.API_KEY).then((res) => {
      expect(res).to.have.status(200);
      expect(res).to.be.json;
    }).catch((error) => {
      throw error;
    });
  });
};

before(() => {
  return Promise.all([ClipController.addOne(clips[3]), ClipController.addOne(clips[4]), ClipController.addOne(clips[5])]);
});

after(async () => {
  clips.forEach(async (clip) => {
    await ClipController.getOneByURL(clip.url).then(async (output) => {
      await ClipController.deleteOne(output._id);
    }).catch((error) => {
      throw error;
    });
  });
});

describe('API Tests', () => {
  describe('POST /clips/', () => {
    it('should return 401 without auth', () => {
      return chai.request(app).post('/api/clips').then((res) => {
        expect(res).to.have.status(401);
      }).catch((error) => {
        throw error;
      });
    });

    it('should return 403 with invalid auth', () => {
      return chai.request(app).post('/api/clips').set('Authorization', 'INVALID KEY HERE').then((res) => {
        expect(res).to.have.status(403);
      }).catch((error) => {
        throw error;
      });
    });

    it('should add a yt clip', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', process.env.API_KEY).send(clips[0]).then((res) => {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        assert(res.body.added);
      }).catch((error) => {
        throw error;
      });
    });

    it('should add a yt clip 2', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', process.env.API_KEY).send(clips[1]).then((res) => {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        assert(res.body.added);
      }).catch((error) => {
        throw error;
      });
    });

    it('should add a twitch clip', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', process.env.API_KEY).send(clips[2]).then((res) => {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        assert(res.body.added);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject a clip that has already been added', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', process.env.API_KEY).send(clips[0]).then((res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        assert(res.body.error);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject a clip with an ivalid url', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', process.env.API_KEY).send({url: 'https://tf2frags.net/'}).then((res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        assert(res.body.error);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject a clip with an ivalid url 2', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', process.env.API_KEY).send({url: 'not a url'}).then((res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        assert(res.body.error);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject a clip with no code', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', process.env.API_KEY).send({url: 'https://clips.twitch.tv/'}).then((res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        assert(res.body.error);
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('PUT /api/clips/:id', () => {
    const clip = clips[3];

    it('should return 401 without auth', () => {
      return chai.request(app).put(`/api/clips/${clip._id}`).then((res) => {
        expect(res).to.have.status(401);
      }).catch((error) => {
        throw error;
      });
    });

    it('should return 403 with invalid auth', () => {
      return chai.request(app).put(`/api/clips/${clip._id}`).set('Authorization', 'INVALID KEY HERE').then((res) => {
        expect(res).to.have.status(403);
      }).catch((error) => {
        throw error;
      });
    });

    it('should return 200 on valid clip', () => {
      return chai.request(app).put(`/api/clips/${clip._id}`).set('Authorization', process.env.API_KEY).then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        assert(res.body.updated);
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('GET /api/', () => {
    it('should return 200', () => {
      return chai.request(app).get('/api').then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.have.json;
      });
    });
  });

  describe('GET /api/clips', () => {
    it('should return 200', () => {
      return chai.request(app).get('/api/clips').then((res) => {
        expect(res).to.have.status(200);
      }).catch((error) => {
        throw error;
      });
    });

    it('body should return a clip', () => {
      return chai.request(app).get('/api/clips').then((res) => {
        expect(res).to.be.json;
        assert(res.body[0]);
        assert(res.body[0].name);
      }).catch((error) => {
        throw error;
      });
    });

    it('should accept valid limit parameters', () => {
      return chai.request(app).get('/api/clips?limit=3').then((res) => {
        expect(res).to.be.json;
        assert(res.body.length === 3);
      }).catch((error) => {
        throw error;
      });
    });

    it('should accept valid limit parameters 2', () => {
      return chai.request(app).get('/api/clips?limit=0').then((res) => {
        expect(res).to.be.json;
        assert(res.body.length > 0);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject invalid limit parameters', () => {
      return chai.request(app).get('/api/clips?limit=-1').then((res) => {
        expect(res).to.have.status(400);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject invalid limit parameters 2', () => {
      return chai.request(app).get('/api/clips?limit=abcd').then((res) => {
        expect(res).to.have.status(400);
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('GET /api/clips/count', () => {
    it('should return 200', () => {
      return chai.request(app).get('/api/clips/count').then((res) => {
        expect(res).to.have.status(200);
      }).catch((error) => {
        throw error;
      });
    });

    it('should return a count >= 0', () => {
      return chai.request(app).get('/api/clips/count').then((res) => {
        expect(res).to.be.json;
        assert(res.body.count);
        assert(res.body.count >= 0);
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('GET /api/clips/current', () => {
    it('should return 200', () => {
      return chai.request(app).get('/api/clips/current').then((res) => {
        expect(res).to.have.status(200);
      });
    });

    it('should return current clip', () => {
      return chai.request(app).get('/api/clips/current').then((res) => {
        expect(res).to.be.json;
        assert(res.body);
        assert(res.body.name);
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('GET /api/clips/previous', () => {
    it('should return 200', () => {
      return chai.request(app).get('/api/clips/previous').then((res) => {
        expect(res).to.have.status(200);
      });
    });

    it('should return previous clip', () => {
      return chai.request(app).get('/api/clips/previous').then((res) => {
        expect(res).to.be.json;
        assert(res.body);
        assert(res.body.name);
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('GET /api/clips/queue', () => {
    it('should return 200', () => {
      return chai.request(app).get('/api/clips/queue').then((res) => {
        expect(res).to.have.status(200);
      }).catch((error) => {
        throw error;
      });
    });

    it('should return a clip', () => {
      return chai.request(app).get('/api/clips/queue').then((res) => {
        expect(res).to.be.json;
        assert(res.body[0]);
        assert(res.body[0].name);


        assert(res.body[1]);
        assert(res.body[1].name);
        assert(res.body[1].order >= res.body[0].order);
      }).catch((error) => {
        throw error;
      });
    });

    it('should accept valid limit parameters', () => {
      return chai.request(app).get('/api/clips/queue?limit=3').then((res) => {
        expect(res).to.be.json;
        assert(res.body.length === 3);
      }).catch((error) => {
        throw error;
      });
    });

    it('should accept valid limit parameters 2', () => {
      return chai.request(app).get('/api/clips/queue?limit=0').then((res) => {
        expect(res).to.be.json;
        assert(res.body.length > 0);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject invalid limit parameters', () => {
      return chai.request(app).get('/api/clips/queue?limit=-1').then((res) => {
        expect(res).to.have.status(400);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject invalid limit parameters 2', () => {
      return chai.request(app).get('/api/clips/queue?limit=abcd').then((res) => {
        expect(res).to.have.status(400);
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('GET /api/clips/randomise', () => {
    requireAPIKey('/api/clips/randomise', 'get');

    it('should change the order of the clips', async () => {
      try {
        const clip1 = await ClipController.getNext();
        await chai.request(app).get('/api/clips/randomise').set('Authorization', process.env.API_KEY);
        const clip2 = await ClipController.getNext();

        assert(clip1._id !== clip2._id);
      } catch (error) {
        throw error;
      }
    });
  });

  describe('GET /api/clips/error', () => {
    requireAPIKey('/api/clips/error', 'get');

    it('should return clips with errors', () => {
      return chai.request(app).get('/api/clips/error').set('Authorization', process.env.API_KEY).then((res) => {
        res.body.forEach((element) => {
          assert(element.error);
        });
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('GET /api/clips/reported', () => {
    requireAPIKey('/api/clips/reported', 'get');

    it('should return clips with reports', () => {
      return chai.request(app).get('/api/clips/reported').set('Authorization', process.env.API_KEY).then((res) => {
        res.body.forEach((element) => {
          assert(element.reported);
        });
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('GET /api/clips/next', () => {
    requireAPIKey('/api/clips/next', 'get');

    it('should skip the current clip', async () => {
      try {
        const current = await ClipController.getCurrent();
        await chai.request(app).get('/api/clips/next').set('Authorization', process.env.API_KEY);
        const newCurrent = await ClipController.getCurrent();

        assert(newCurrent.code !== current.code);
      } catch (error) {
        throw error;
      }
    });

    it('should update the set the previous clip to the last current clip', async () => {
      try {
        const current = await ClipController.getCurrent();
        await chai.request(app).get('/api/clips/next').set('Authorization', process.env.API_KEY);
        const newCurrent = await ClipController.getPrevious();

        assert(newCurrent.code === current.code);
      } catch (error) {
        throw error;
      }
    });

    it('sets the current clip to the previous clips and changes the current clip', async () => {
      try {
        const current = await ClipController.getCurrent();
        await chai.request(app).get('/api/clips/next').set('Authorization', process.env.API_KEY);
        const previous = await ClipController.getPrevious();
        const newCurrent = await ClipController.getCurrent();

        assert(current.code === previous.code);
        assert(current.code !== newCurrent.code);
      } catch (error) {
        throw error;
      }
    });
  });

  describe('GET /api/clips/:code', () => {
    it('should return 404 on invalid code', () => {
      return chai.request(app).get('/api/clips/NOTAVALIDCODE').then((res) => {
        expect(res).to.have.status(404);
        expect(res).to.be.json;
      }).catch((error) => {
        throw error;
      });
    });

    it('should return 200 on valid code', async () => {
      const clip = await ClipController.getNext();
      return chai.request(app).get(`/api/clips/${clip.code}`).then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        assert(res.body.name);
      }).catch((error) => {
        throw error;
      });
    });
  });
});
