const chai = require('chai');
const chaiHttp = require('chai-http');

const ClipController = require('../../contollers/clip');

const db = require('../../src/db');

chai.use(chaiHttp);
chai.should();

const expect = chai.expect;
const assert = chai.assert;

const app = require('../../server');

const apiKey = process.env.API_KEY;

const clips = [
  {
    url: 'https://youtu.be/CLIPNAME1',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
  },
  {
    url: 'https://youtube.com/watch?v=CLIPNAME2',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
  },
  {
    url: 'https://clips.twitch.tv/CLIPNAME3',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
  },
  {
    url: 'https://youtu.be/CLIPNAME4',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
  },
  {
    url: 'https://youtu.be/CLIPNAME5',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
  },
  {
    url: 'https://youtu.be/CLIPNAME6',
    uploadedBy: 1,
    name: 'TEST CLIP IGNORE',
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
    return chai.request(app).get(route).set('Authorization', apiKey).then((res) => {
      expect(res).to.have.status(200);
      expect(res).to.be.json;
    }).catch((error) => {
      throw error;
    });
  });
};

before(async () => {
  db.connectToServer(() => { // force the db to start early
    return Promise.all([
      ClipController.addOne(clips[3]),
      ClipController.addOne(clips[4]),
      ClipController.addOne(clips[5]),
      db.getDb().collection('apiKeys').insertOne({key: 'key'}),
    ]);
  });
});

after(async () => {
  return Promise.all([
    db.getDb().collection('clips').deleteMany(),
    db.getDb().collection('apiKeys').deleteMany(),
  ]);
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
      return chai.request(app).post('/api/clips/').set('Authorization', apiKey).send(clips[0]).then((res) => {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        assert(res.body.added);
      }).catch((error) => {
        throw error;
      });
    });

    it('should add a yt clip 2', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', apiKey).send(clips[1]).then((res) => {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        assert(res.body.added);
      }).catch((error) => {
        throw error;
      });
    });

    it('should add a twitch clip', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', apiKey).send(clips[2]).then((res) => {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        assert(res.body.added);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject a clip that has already been added', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', apiKey).send(clips[0]).then((res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        assert(res.body.error);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject a clip with an ivalid url', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', apiKey).send({url: 'https://tf2frags.net/'}).then((res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        assert(res.body.error);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject a clip with an ivalid url 2', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', apiKey).send({url: 'not a url'}).then((res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        assert(res.body.error);
      }).catch((error) => {
        throw error;
      });
    });

    it('should reject a clip with no code', () => {
      return chai.request(app).post('/api/clips/').set('Authorization', apiKey).send({url: 'https://clips.twitch.tv/'}).then((res) => {
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
      return chai.request(app).put(`/api/clips/${clip._id}`).set('Authorization', apiKey).then((res) => {
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

  describe('GET /api/clips/error', () => {
    requireAPIKey('/api/clips/error', 'get');

    it('should return clips with errors', () => {
      return chai.request(app).get('/api/clips/error').set('Authorization', apiKey).then((res) => {
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
      return chai.request(app).get('/api/clips/reported').set('Authorization', apiKey).then((res) => {
        res.body.forEach((element) => {
          assert(element.reported);
        });
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('GET /api/clips/:id', () => {
    it('should return 400 on invalid id', () => {
      return chai.request(app).get('/api/clips/NOTAVALIDCODE').then((res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
      }).catch((error) => {
        throw error;
      });
    });
  });
});
