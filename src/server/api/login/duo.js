import extend from 'deep-extend';
import duo from 'duo_web';

import authenticate from '../../util/authenticate';
import secrets from '../../../../config/secrets';

/**
 * Attempt to log the user in.
 *
 * @param {Object} ctx Server-side application context
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function handler(ctx, req, res) {
  const data = extend({
    username: '',
    password: ''
  }, req.body);

  if (!data.username || !data.password) {
    return res.error(400, 'Both username and password must be supplied.');
  }

  // Validate the correctness of the provided credentials
  return authenticate.check(data.username, data.password, (err, resp) => {
    if (err || (resp.statusCode !== 200)) {
      // Increment the number of times a login from this IP address has failed
      ctx.blacklist.increment(req.remoteIP);

      // Send a notification that a login attempt was unsuccessful
      if (ctx.allu) {
        ctx.allu.template('Auth',
          `Failed login attempt from ${req.remoteIP} with username '${data.username}'.`, [
            {
              title: 'Lookup IP',
              url: `https://freegeoip.net/?q=${req.remoteIP}`
            },
            {
              title: 'View logs',
              /* eslint-disable max-len */
              url: `https://logs.internal.kevinlin.info/app/kibana#/discover?index:%27logstash-*%27,interval:auto,query:(query_string:(analyze_wildcard:!t,query:%27_type:%22apache_access%22%20AND%20path.raw:%22%2Fhome%2Fkiwi%2Fserver%2Flogs%2Fapache%2Fkevinlin-auth-access.log%22%20AND%20clientip:%22${req.remoteIP}%22%27))&_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-1h,mode:quick,to:now))&_a=(columns:!(_source),index:%27logstash-*%27,interval:auto,query:(query_string:(analyze_wildcard:!t,query:%27_type:%22apache_access%22%20AND%20path.raw:%22%2Fhome%2Fkiwi%2Fserver%2Flogs%2Fapache%2Fkevinlin-auth-access.log%22%20AND%20clientip:%22${req.remoteIP}%22%27)),sort:!(%27@timestamp%27,desc))`
              /* eslint-enable max-len */
            }
          ]);
      }

      return res.error(401, 'The username/password combination is incorrect.');
    }

    // Then, initialize a Duo 2FA transaction
    const sigRequest = duo.sign_request(
      secrets.DUO_IKEY,
      secrets.DUO_SKEY,
      secrets.DUO_AKEY,
      data.username
    );

    return res.success({
      sigRequest,
      duoHost: secrets.DUO_HOST
    });
  });
}

export default handler;
