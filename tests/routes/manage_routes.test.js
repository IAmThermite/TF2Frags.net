const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
chai.should();

const expect = chai.expect;

const app = require('../../server');

describe('Manage Page', () => {
  describe('Get /manage/', () => {
    it('should return 200', () => {
      return chai.request(app).get('/manage').then((res) => {
        expect(res).to.redirect;
        res.should.have.status(200);
      }).catch((error) => {
        throw error;
      });
    });
  });
});

describe('Upload Page', () => {
  describe('Get /manage/upload', () => {
    it('should return 200', () => {
      return chai.request(app).get('/manage/upload').then((res) => {
        expect(res).to.redirect;
        res.should.have.status(200);
      }).catch((error) => {
        throw error;
      });
    });
  });
});
