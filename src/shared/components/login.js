/* global window, setTimeout */

import {browserHistory} from 'react-router';
import Helmet from 'react-helmet';
import React from 'react';
import request from 'browser-request';
import url from 'url';
import querystring from 'querystring';

import Container from './layout/container';
import Overlay from './layout/overlay';

export default class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false
    };
  }

  componentDidMount() {
    // First check the authentication status; it's possible the session is already authenticated,
    // in which case we can navigate away from this page.
    request.get({
      url: '/auth-check'
    }, (err, resp) => {  // eslint-disable-line handle-callback-err
      if (resp.statusCode === 200) {
        browserHistory.push('/status');
      }
    });
  }

  submitLogin(evt) {
    evt.preventDefault();

    this.setState({
      isLoading: true
    });

    request.post({
      url: '/api/login',
      json: {
        username: this.state.username,
        password: this.state.password
      }
    }, (err, resp) => {
      if (err) {
        // Safe to noop in this case; we want the response code to be set here regardless so that
        // logic later can handle it appropriately
      }

      const query = querystring.parse(url.parse(window.location.href).query);

      this.setState({
        isLoading: false,
        status: resp.statusCode,
        // Don't attempt a redirect if there was an error
        redirectURL: (resp.statusCode === 200) ? query.redirect : null
      });
    });
  }

  setText(key, evt) {
    this.setState({
      [key]: evt.target.value
    });
  }

  renderSuccessAlert() {
    const message = this.state.redirectURL ? 'Redirecting you now...' : 'Please reload the target page.';

    return (
      <div className="alert alert-done sans-serif light iota text-green">
        Login successful! {message}
      </div>
    );
  }

  renderFailureAlert() {
    return (
      <div className="alert alert-error sans-serif light iota text-red">
        The username/password combination is incorrect. Please try again.
      </div>
    );
  }

  render() {
    let statusAlert;
    if (this.state.status === 200) {
      statusAlert = this.renderSuccessAlert();
    } else if (this.state.status) {
      statusAlert = this.renderFailureAlert();
    }

    // A successful login should set the redirect URL, if available
    if (this.state.redirectURL) {
      setTimeout(() => {
        window.location.href = this.state.redirectURL;
      }, 500);
    }

    return (
      <Container>
        <Helmet title={'Login - auth.kevinlin.info'} />
        <Overlay opacity={this.state.isLoading ? 0.4 : 1}>
          {statusAlert}
          <form>
            <input
              type="text"
              className="login-field form-input sans-serif light iota"
              placeholder="Username"
              onChange={this.setText.bind(this, 'username')}
              autoFocus
            />
            <input
              type="password"
              className="login-field form-input sans-serif light iota"
              placeholder="Password"
              onChange={this.setText.bind(this, 'password')}
            />
            <button
              ref={(elem) => {
                this.buttonSubmit = elem;
              }}
              className="login-btn btn sans-serif iota text-white"
              onClick={this.submitLogin.bind(this)}
            >
              LOG IN
            </button>
          </form>
        </Overlay>
      </Container>
    );
  }
}
