import sinon from 'sinon';
import test from 'tape';

import config from '../../config/common';
import Context from '../../src/server/context';

test('Blacklist cache functions', (t) => {
  const maxFailedAttempts = config.blacklist.maxFailedAttempts;
  config.blacklist.maxFailedAttempts = 2;
  const clock = sinon.useFakeTimers(1000);
  const ctx = Context();
  const ip = '127.0.0.1';

  t.ok(ctx.blacklist, 'Blacklist functions');
  t.deepEqual(ctx.blacklist.getEntries(), {}, 'No entries are initially present in blacklist');
  t.notOk(ctx.blacklist.isBlacklisted(), 'Undefined IP defaults to false blacklist');
  t.notOk(ctx.blacklist.isBlacklisted(ip), 'IP is not blacklisted if not present');
  ctx.blacklist.increment(ip);
  t.deepEqual(ctx.blacklist.getEntries()[ip], {
    count: 1,
    timestamp: 1000
  }, 'Initial entry is added properly');
  t.notOk(ctx.blacklist.isBlacklisted(ip), 'IP is not blacklisted when below threshold');
  clock.tick(5);
  ctx.blacklist.increment(ip);
  t.deepEqual(ctx.blacklist.getEntries()[ip], {
    count: 2,
    timestamp: 1005
  }, 'Entry is modified properly');
  t.ok(ctx.blacklist.isBlacklisted(ip), 'IP is blacklisted after threshold');
  ctx.blacklist.remove(ip);
  t.deepEqual(ctx.blacklist.getEntries(), {}, 'Element is removed from blacklist');
  t.notOk(ctx.blacklist.isBlacklisted(ip), 'IP is not blacklisted after removal');

  config.blacklist.maxFailedAttempts = maxFailedAttempts;
  clock.restore();
  t.end();
});

test('TTL expiry of blacklist entry', (t) => {
  const ttl = config.blacklist.TTL;
  const maxFailedAttempts = config.blacklist.maxFailedAttempts;
  config.blacklist.TTL = 5;
  config.blacklist.maxFailedAttempts = 2;
  const clock = sinon.useFakeTimers(1000);
  const ctx = Context();
  const ip = '127.0.0.1';

  ctx.blacklist.increment(ip);
  ctx.blacklist.increment(ip);
  ctx.blacklist.increment(ip);

  t.ok(ctx.blacklist.isBlacklisted(ip), 'IP is properly blacklisted');
  clock.tick(100);
  t.notOk(ctx.blacklist.isBlacklisted(ip), 'IP is no longer blacklisted after cache expiry');

  config.blacklist.maxFailedAttempts = maxFailedAttempts;
  config.blacklist.TTL = ttl;
  clock.restore();
  t.end();
});

test('Allu client initialization', (t) => {
  Context();

  t.pass('Allu client can be optionally instantiated without throwing errors');

  t.end();
});
