/* eslint-disable no-console,no-process-env,no-undef */

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import path from 'path';
import Express from 'express';

import config from '../../config/common';

/* API methods */
// TODO

const app = Express();

/* CSRF middleware */
const parseForm = bodyParser.urlencoded({extended: false});

/* Templating engine */
app.set('view engine', 'pug');

/* Static routes */
app.use('/static', Express.static(path.resolve(__dirname, '../client/static')));
app.use('/dist', Express.static(path.resolve(__dirname, '../../dist')));

/* Express middleware */
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/* API endpoints */

/* View endpoints */
app.get('*', (req, res) => {
  res.render(path.resolve(__dirname, '../client/index'));
});

const server = app.listen(process.env.PORT || config.app.port || 3000, () => {
  var port = server.address().port;
  console.log('Server is listening at %s', port);
});
