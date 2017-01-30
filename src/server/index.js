/* eslint-disable no-console,no-process-env,no-undef */

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import Express from 'express';
import morgan from 'morgan';
import path from 'path';
import raven from 'raven';

import admin from './api/admin';
import config from '../../config/common';
import Context from './context';
import login from './api/login';
import logout from './api/logout';
import middleware from './middleware';
import secrets from '../../config/secrets';

/* Initialization */
const app = Express();
const ctx = new Context();
raven.config(secrets.SENTRY_DSN).install();

/* Templating engine */
app.set('view engine', 'pug');

/* Trust production reverse proxy */
app.set('trust proxy', true);

/* Static routes */
app.use('/static', Express.static(path.resolve(__dirname, '../client/static')));

/* Express middleware */
app.use(raven.requestHandler());
app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.json({type: '*/*'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(middleware.remoteIP.bind(null, ctx));
app.use(middleware.response.bind(null, ctx));
app.use('/api/*', middleware.blacklist.bind(null, ctx));

/* API endpoints */
// Login
app.post('/api/login/apache', login.apache.bind(null, ctx));
app.post('/api/login/duo', login.duo.bind(null, ctx));
app.post('/api/login/is-fingerprint-valid', login.isFingerprintValid.bind(null, ctx));
app.post('/api/login/otp', login.otp.bind(null, ctx));
app.post('/api/login/u2f/challenge', login.u2f.challenge.bind(null, ctx));
app.post('/api/login/u2f/verify', login.u2f.verify.bind(null, ctx));
// Logout
app.post('/api/logout/logout', logout.logout.bind(null, ctx));
// Blacklist
app.get('/api/admin/blacklist/list', admin.blacklist.list.bind(null, ctx));
// Fingerprint
app.put('/api/admin/fingerprint/add', admin.fingerprint.add.bind(null, ctx));
app.get('/api/admin/fingerprint/list', admin.fingerprint.list.bind(null, ctx));
app.delete('/api/admin/fingerprint/revoke', admin.fingerprint.revoke.bind(null, ctx));
// U2F registration
app.get('/api/admin/u2f/list', admin.u2f.list.bind(null, ctx));
app.post('/api/admin/u2f/register-challenge', admin.u2f.registerChallenge.bind(null, ctx));
app.post('/api/admin/u2f/register-verify', admin.u2f.registerVerify.bind(null, ctx));

/* View endpoints */
app.get('*', require('./view/main').default.bind(null, ctx));

app.use(raven.errorHandler());

const server = app.listen(process.env.PORT || config.app.port || 3000, () => {
  const port = server.address().port;
  console.log('Server is listening at %s', port);
});
