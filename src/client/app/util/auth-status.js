import dottie from 'dottie';
import request from 'browser-request';

import browser from './browser';

function redirectIfAuthenticated(loading) {
  const redirectURL = browser.parseURL().query.redirect;

  loading((done) => {
    request.get({
      url: '/auth-check'
    }, (err, resp) => {  // eslint-disable-line handle-callback-err
      if (dottie.get(resp, 'statusCode', 502) === 200) {
        return redirectURL ? browser.go(redirectURL) : browser.push('/status');
      }

      return done();
    });
  });
}

export default {redirectIfAuthenticated};
