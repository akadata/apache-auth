/* global window, Duo, setTimeout */

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

  shouldComponentUpdate(nextProps, nextState) {
    // Simple updates to the form (username, password) fields in state need not trigger a component
    // rerender.
    return !((this.state.username !== nextState.username) ||
      (this.state.password !== nextState.password));
  }

  onDuoResp(duoForm) {
    // Clear the current Duo sig request so that we hide the Duo 2FA form after an initial response
    // is received.
    this.setState({
      sigRequest: null
    });

    // Grab the sig response from the Duo form element and start a second authentication request
    // with this token for server-side validation.
    const sigResponse = duoForm.firstChild.value;
    this.submitLoginApache(sigResponse);
  }

  submitLoginDuo(evt) {
    evt.preventDefault();

    this.setState({
      isLoading: true
    });

    request.post({
      url: '/api/login-duo',
      json: {
        username: this.state.username,
        password: this.state.password
      }
    }, (err, resp, body) => {
      if (err) {
        this.setState({
          isLoading: false,
          errorMessage: 'Failed to initialize two-factor authentication. Please try again.'
        });
      } else {
        this.setState({
          isLoading: false,
          sigRequest: body.sigRequest,
          duoHost: body.duoHost
        });
      }
    });
  }

  submitLoginApache(sigResponse) {
    this.setState({
      isLoading: true
    });

    request.post({
      url: '/api/login-apache',
      json: {
        username: this.state.username,
        password: this.state.password,
        sigResponse
      }
    }, (err, resp) => {
      if (err) {
        // Safe to noop in this case; we want the response code to be set here regardless so that
        // logic later can handle it appropriately
      }

      const isLoginSuccess = resp.statusCode === 200;
      const query = querystring.parse(url.parse(window.location.href).query);

      this.setState({
        isLoading: false,
        // Indicates whether the user has successfully authenticated
        isLoginSuccess,
        // Indicates whether the user has completed the entire auth flow (successfully or not)
        isLoginComplete: true,
        // Don't attempt a redirect if there was an error
        redirectURL: isLoginSuccess ? query.redirect : null,
        errorMessage: isLoginSuccess ? null : 'The username/password combination is incorrect. Please try again.'
      });
    });
  }

  setFormState(key, evt) {
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
    const {errorMessage} = this.state;

    return (
      <div className="alert alert-error sans-serif light iota text-red">
        {errorMessage}
      </div>
    );
  }

  render() {
    const {isLoginSuccess, isLoginComplete, redirectURL, sigRequest, duoHost} = this.state;

    const statusAlert = (() => {
      if (isLoginSuccess) {
        return this.renderSuccessAlert();
      } else if (isLoginComplete) {
        return this.renderFailureAlert();
      }
      return null;
    })();

    // A successful login should set the redirect URL, if available
    if (redirectURL) {
      setTimeout(() => {
        window.location.href = redirectURL;
      }, 500);
    }

    if (sigRequest) {
      setTimeout(() => {
        Duo.init({
          /* eslint-disable camelcase */
          host: duoHost,
          sig_request: sigRequest,
          submit_callback: this.onDuoResp.bind(this)
          /* eslint-enable camelcase */
        });
      }, 100);
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
              onChange={this.setFormState.bind(this, 'username')}
              autoFocus
            />
            <input
              type="password"
              className="login-field form-input sans-serif light iota"
              placeholder="Password"
              onChange={this.setFormState.bind(this, 'password')}
            />
            <button
              className={`login-btn btn sans-serif iota text-white ${sigRequest ? 'disabled' : ''}`}
              onClick={this.submitLoginDuo.bind(this)}
            >
              LOG IN
            </button>
          </form>

          <iframe
            id="duo_iframe"
            className="margin-large--top"
            style={{
              display: sigRequest ? 'inherit' : 'none'
            }}
          />
        </Overlay>
      </Container>
    );
  }
}
