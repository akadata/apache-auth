import sinon from 'sinon';
import test from 'tape';

import response from '../../../src/server/middleware/response';

test('Response success function', (t) => {
  const mockReq = {};
  const mockRes = {
    status: sinon.spy(),
    send: sinon.spy()
  };
  const mockNext = sinon.spy();

  t.notOk(mockRes.success, 'No success function before middleware');

  response(null, mockReq, mockRes, mockNext);

  t.ok(mockRes.success, 'Success function is added to response object');
  mockRes.success({data: true});
  t.notOk(mockRes.status.called, 'No attempt to change default status code');
  t.ok(mockRes.send.calledWith({success: true, data: true}), 'JSON response data is correct');
  t.ok(mockNext.called, 'Next handler is always invoked');

  t.end();
});

test('Response error function', (t) => {
  const mockReq = {};
  const mockRes = {
    status: sinon.spy(),
    send: sinon.spy()
  };
  const mockNext = sinon.spy();

  t.notOk(mockRes.error, 'No error function before middleware');

  response(null, mockReq, mockRes, mockNext);

  t.ok(mockRes.error, 'Error function is added to response object');
  mockRes.error(404, 'error', {data: true});
  t.ok(mockRes.status.calledWith(404), 'Passed status code is set on response');
  t.ok(mockRes.send.calledWith({
    success: false,
    message: 'error',
    data: true
  }), 'JSON response data is correct');
  t.ok(mockNext.called, 'Next handler is always invoked');

  t.end();
});
