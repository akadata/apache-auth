import sinon from 'sinon';
import test from 'tape';

import contextFactory from '../../util/context-factory';
import handler from '../../../src/server/view/main';

test('Blacklisted IP is served separate template', (t) => {
  const mockCtx = contextFactory.create(['127.0.0.1']);
  const mockReq = {
    headers: {
      'x-forwarded-for': '127.0.0.1'
    }
  };
  const mockRes = {
    render: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  const template = mockRes.render.getCalls()[0].args[0];
  t.ok(template.endsWith('client/blacklist'), 'Blacklist template is rendered');

  t.end();
});

test('Non-blacklisted IP is served regular template', (t) => {
  const mockCtx = contextFactory.create();
  const mockReq = {
    headers: {
      'x-forwarded-for': '127.0.0.1'
    }
  };
  const mockRes = {
    render: sinon.spy()
  };

  handler(mockCtx, mockReq, mockRes);

  const template = mockRes.render.getCalls()[0].args[0];
  t.ok(template.endsWith('client/index'), 'Regular template is rendered');

  t.end();
});
