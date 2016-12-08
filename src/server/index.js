/* eslint-disable no-console,no-process-env,no-undef */

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import Express from 'express';
import morgan from 'morgan';
import path from 'path';

import config from '../../config/common';

const app = Express();

/* Templating engine */
app.set('view engine', 'pug');

/* Static routes */
app.use('/static', Express.static(path.resolve(__dirname, '../client/static')));
app.use('/dist', Express.static(path.resolve(__dirname, '../../dist')));

/* Express middleware */
app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/* API endpoints */
app.post('/api/login', require('./api/login').default);
app.post('/api/logout', require('./api/logout').default);

/* View endpoints */
app.get('*', (req, res) => {
  res.render(path.resolve(__dirname, '../client/index'));
});

const server = app.listen(process.env.PORT || config.app.port || 3000, () => {
  const port = server.address().port;
  console.log('Server is listening at %s', port);
});
