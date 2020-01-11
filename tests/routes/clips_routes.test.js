const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
chai.should();

const expect = chai.expect;

const app = require('../../server');

describe('Clips Routes', () => {
  describe('Get /clips/', () => {
    it('should return status 200', () => {
      return chai.request(app).get('/clips/').then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.html;
      }).catch((error) => {
        throw error;
      });
    });
  });
});

describe('Clips Routes', () => {
  describe('Get /clips/:id', () => {
    it('should return status 400 on invalid code', () => {
      return chai.request(app).get('/clips/INVALID').then((res) => {
        expect(res).to.have.status(400);
      }).catch((error) => {
        throw error;
      });
    });
  });
});
