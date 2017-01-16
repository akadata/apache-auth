import React from 'react';
import {IndexRedirect, Redirect, Route} from 'react-router';

import Admin from './components/pages/admin';
import AppRoot from './components/app-root';
import Blacklist from './components/pages/blacklist';
import Login from './components/pages/login';
import Logout from './components/pages/logout';
import OTP from './components/pages/otp';
import Status from './components/pages/status';

export default (
  <Route path="/" component={AppRoot}>
    <IndexRedirect to="/login" />
    <Route path="login" component={Login} />
    <Route path="otp" component={OTP} />
    <Route path="logout" component={Logout} />
    <Route path="status" component={Status} />
    <Route path="blacklist" component={Blacklist} />
    <Route path="admin" component={Admin} />
    <Redirect from="*" to="/login" />
  </Route>
);
