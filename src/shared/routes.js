import React from 'react';
import {IndexRedirect, Redirect, Route} from 'react-router';

import Admin from './components/admin';
import AppRoot from './components/app-root';
import Blacklist from './components/blacklist';
import Login from './components/login';
import Logout from './components/logout';
import Status from './components/status';

export default (
  <Route path="/" component={AppRoot}>
    <IndexRedirect to="/login" />
    <Route path="login" component={Login} />
    <Route path="logout" component={Logout} />
    <Route path="status" component={Status} />
    <Route path="blacklist" component={Blacklist} />
    <Route path="admin" component={Admin} />
    <Redirect from="*" to="/login" />
  </Route>
);
