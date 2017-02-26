import {browserHistory} from 'react-router';
import Duo from 'react-duo-web';
import Fingerprint from 'fingerprintjs2';
import Helmet from 'react-helmet';
import LoadingHOC from 'react-loading-hoc';
import Lock from 'react-icons/lib/md/lock-outline';
import React from 'react';
import request from 'browser-request';
import url from 'url';

import Container from '../../layout/container';
import Overlay from '../../layout/overlay';

import Alert, {ALERT_TYPE_SUCCESS, ALERT_TYPE_WARN, ALERT_TYPE_ERROR} from '../../ui/alert';
import Button from '../../ui/button';
import TextField from '../../ui/text-field';

import browser from '../../../util/browser';

export class Login extends React.Component {
  constructor(props) {
    super(props);

    this.redirectURL = browser.parseURL().query.redirect;
    this.state = {loginStatus: {}};
  }

  componentDidMount() {
    this.props.loading((done) => {
      request.get({
        url: '/auth-check'
      }, (err, resp) => {  // eslint-disable-line handle-callback-err
        if (resp.statusCode === 200) {
          if (this.redirectURL) {
            browser.go(this.redirectURL);
          } else {
            browser.push('/status');
          }
        }
        return done();
      });
    });

    new Fingerprint().get((fingerprint) => {
      request.post({
        url: '/api/login/is-fingerprint-valid',
        json: {fingerprint}
      }, (err, resp) => {  // eslint-disable-line handle-callback-err
        if (resp.statusCode === 200 && !browser.parseURL().query.force) {
          browserHistory.push({
            pathname: '/u2f',
            query: browser.parseURL().query
          });
        }
      });
    });
  }

  submitLoginDuo() {
    return this.props.loading((done) => {
      request.post({
        url: '/api/login/duo',
        json: {
          username: this.usernameInput.getValue(),
          password: this.passwordInput.getValue()
        }
      }, (err, resp, loginStatus) => {  // eslint-disable-line handle-callback-err
        this.setState({loginStatus});
        return done();
      });
    });
  }

  submitLoginApache(sigResponse) {
    this.props.loading((done) => {
      request.post({
        url: '/api/login/apache',
        json: {
          username: this.usernameInput.getValue(),
          password: this.passwordInput.getValue(),
          sigResponse
        }
      }, (err, resp, loginStatus) => {  // eslint-disable-line handle-callback-err
        if (resp.statusCode === 200) {
          this.setState({isLoginComplete: true});
          if (this.redirectURL) {
            browser.go(this.redirectURL);
          } else {
            browser.push('/status');
          }
        }

        this.setState({loginStatus});
        return done();
      });
    });
  }

  handleSubmitLogin(evt) {
    evt.preventDefault();

    this.submitLoginDuo();
  }

  onDuoResp(sigResponse) {
    this.submitLoginApache(sigResponse);
  }

  handleAuthorizationRequest() {
    browserHistory.push({
      pathname: '/authorize',
      query: browser.parseURL().query
    });
  }

  render() {
    const {isLoading} = this.props;
    const {loginStatus, isLoginComplete} = this.state;

    const redirectURLParsed = this.redirectURL && url.parse(this.redirectURL);

    return (
      <div>
        <Container>
          <Helmet title={'Login - auth.kevinlin.info'} />
          <Overlay isLoading={isLoading}>
            {
              !isLoginComplete && this.redirectURL && (
                <Alert
                  type={ALERT_TYPE_WARN}
                  className="margin--bottom"
                  title="Your session must be authenticated."
                  message={`Please login to access ${redirectURLParsed.host}.`}
                />
              )
            }

            {
              isLoginComplete && this.redirectURL && (
                <Alert
                  type={ALERT_TYPE_SUCCESS}
                  className="margin--bottom"
                  title="Login success!"
                  message={`Redirecting you to ${this.redirectURL}...`}
                />
              )
            }

            {
              loginStatus.message && (
                <Alert
                  type={ALERT_TYPE_ERROR}
                  className="margin--bottom"
                  title="There was an error logging you in."
                  message={loginStatus.message}
                />
              )
            }

            <form>
              <div className="margin--bottom">
                <p className="text--field-header">Username</p>
                <TextField
                  ref={(elem) => {
                    this.usernameInput = elem;
                  }}
                  className="sans-serif iota"
                  autoFocus={true}
                  disabled={loginStatus.sigRequest}
                />
              </div>

              <div className="margin-large--bottom">
                <p className="text--field-header">Password</p>
                <TextField
                  ref={(elem) => {
                    this.passwordInput = elem;
                  }}
                  className="sans-serif iota"
                  type="password"
                  disabled={loginStatus.sigRequest}
                />
              </div>

              <Button
                text="Login"
                className="login-submit-btn sans-serif semibold iota"
                onClick={this.handleSubmitLogin.bind(this)}
                disabled={isLoading || Boolean(loginStatus.sigRequest)}
              />
            </form>

            {
              loginStatus.sigRequest && (
                <Duo
                  className="margin-large--top"
                  host={loginStatus.duoHost}
                  sigRequest={loginStatus.sigRequest}
                  sigResponseCallback={this.onDuoResp.bind(this)}
                />
              )
            }
          </Overlay>
        </Container>

        {
          this.redirectURL && (
            <Lock
              className="auth-request"
              onClick={this.handleAuthorizationRequest.bind(this)}
            />
          )
        }
      </div>
    );
  }
}

export default LoadingHOC(Login);
