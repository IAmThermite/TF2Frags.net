const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
chai.should();

const expect = chai.expect;

const app = require('../../server');

describe('Clips Page', () => {
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

describe('Clips Page', () => {
  describe('Get /clips/:id', () => {
    it('should return status 400', () => {
      return chai.request(app).get('/clips/1').then((res) => {
        expect(res).to.have.status(404);
      }).catch((error) => {
        throw error;
      });
    });
  });
});
