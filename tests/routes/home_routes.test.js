const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
chai.should();

const expect = chai.expect;

const app = require('../../server');

describe('Home Routes', () => {
  describe('Get /', () => {
    it('should return status 200', () => {
      return chai.request(app).get('/').then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.html;
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('Get /about/', () => {
    it('should return status 200', () => {
      return chai.request(app).get('/about').then((res) => {
        expect(res).to.have.status(200);
      }).catch((error) => {
        throw error;
      });
    });
  });

  describe('Get /NOTVALIDROUTE/', () => {
    it('should return status 404', () => {
      return chai.request(app).get('/NOTVALIDROUTE').then((res) => {
        expect(res).to.have.status(404);
      }).catch((error) => {
        throw error;
      });
    });
  });
});
