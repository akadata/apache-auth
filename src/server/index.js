/* eslint-disable no-console,no-process-env,no-undef */

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import Express from 'express';
import morgan from 'morgan';
import path from 'path';
import raven from 'raven';

import config from '../../config/common';
import Context from './context';
import secrets from '../../config/secrets';

/* Initialization */
const app = Express();
const ctx = Context();
const sentryClient = new raven.Client(secrets.SENTRY_DSN);
sentryClient.patchGlobal();

/* Templating engine */
app.set('view engine', 'pug');

/* Static routes */
app.use('/static', Express.static(path.resolve(__dirname, '../client/static')));
app.use('/dist', Express.static(path.resolve(__dirname, '../../dist')));

/* Express middleware */
app.use(raven.middleware.express.requestHandler(secrets.SENTRY_DSN));
app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/* API endpoints */
app.post('/api/login-duo', require('./api/login-duo').default.bind(null, ctx));
app.post('/api/login-apache', require('./api/login-apache').default.bind(null, ctx));
app.post('/api/logout', require('./api/logout').default.bind(null, ctx));
app.post('/api/blacklist-entries', require('./api/blacklist-entries').default.bind(null, ctx));

/* View endpoints */
app.get('*', require('./view/main').default.bind(null, ctx));

app.use(raven.middleware.express.errorHandler(secrets.SENTRY_DSN));

const server = app.listen(process.env.PORT || config.app.port || 3000, () => {
  const port = server.address().port;
  console.log('Server is listening at %s', port);
});
