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
      isLoading: true
    };
  }

  componentDidMount() {
    const redirectURL = this.parseRedirectURL(window.location.href);

    // First check the authentication status; it's possible the session is already authenticated,
    // in which case we can navigate away from this page.
    request.get({
      url: '/auth-check'
    }, (err, resp) => {  // eslint-disable-line handle-callback-err
      this.setState({
        isLoading: false
      });

      if (resp.statusCode === 200) {
        if (redirectURL) {
          window.location.href = redirectURL;
        } else {
          browserHistory.push('/status');
        }
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
      isLoading: true,
      isLoginComplete: false
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
          isLoginComplete: true,
          errorMessage: 'Failed to initialize two-factor authentication. Please try again.'
        });
      } else if (resp.statusCode === 401) {
        this.setState({
          isLoginComplete: true,
          errorMessage: 'The username/password combination is incorrect. Please try again.'
        });
      } else if (resp.statusCode === 403) {
        // IP is blacklisted; immediately redirect and quit further logic here.
        return browserHistory.push('/blacklist');
      } else {
        this.setState({
          sigRequest: body.sigRequest,
          duoHost: body.duoHost
        });
      }

      return this.setState({
        isLoading: false
      });
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

      this.setState({
        isLoading: false,
        // Indicates whether the user has successfully authenticated
        isLoginSuccess,
        // Indicates whether the user has completed the entire auth flow (successfully or not)
        isLoginComplete: true,
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
    return (
      <div className="login-success-alert alert alert-done sans-serif light iota text-green">
        Login successful! Redirecting you now...
      </div>
    );
  }

  renderFailureAlert() {
    const {errorMessage} = this.state;

    return errorMessage ? (
      <div className="login-error-alert alert alert-error sans-serif light iota text-red">
        {errorMessage}
      </div>
    ) : null;
  }

  parseRedirectURL(windowURL) {
    const query = querystring.parse(url.parse(windowURL).query);
    return query.redirect;
  }

  render() {
    const {isLoading, isLoginSuccess, isLoginComplete, sigRequest, duoHost} = this.state;
    const redirectURL = this.parseRedirectURL(window.location.href);

    const statusAlert = (() => {
      if (isLoginSuccess && redirectURL) {
        return this.renderSuccessAlert();
      } else if (isLoginComplete) {
        return this.renderFailureAlert();
      }
      return null;
    })();

    // A successful login should set the redirect URL, if available
    if (isLoginComplete && isLoginSuccess) {
      setTimeout(() => {
        if (redirectURL) {
          window.location.href = redirectURL;
        } else {
          browserHistory.push('/status');
        }
      }, 100);
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
        <Overlay opacity={isLoading ? 0.4 : 1}>
          {statusAlert}
          <form>
            <input
              type="text"
              className="username-field login-field form-input sans-serif light iota"
              placeholder="Username"
              onChange={this.setFormState.bind(this, 'username')}
              autoFocus
            />
            <input
              type="password"
              className="password-field login-field form-input sans-serif light iota"
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
