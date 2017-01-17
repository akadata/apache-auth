import Fingerprint from 'fingerprintjs2';
import extend from 'deep-extend';
import Helmet from 'react-helmet';
import {Link} from 'react-router';
import LoadingHOC from 'react-loading-hoc';
import React from 'react';
import request from 'browser-request';
import url from 'url';

import Container from '../../layout/container';
import Overlay from '../../layout/overlay';

import Alert, {ALERT_TYPE_SUCCESS, ALERT_TYPE_WARN, ALERT_TYPE_ERROR} from '../../ui/alert';
import Button from '../../ui/button';
import TextField from '../../ui/text-field';

import browser from '../../../util/browser';

export class OTP extends React.Component {
  constructor(props) {
    super(props);

    this.state = {loginStatus: {}};
  }

  componentDidMount() {
    const redirectURL = browser.parseURL().query.redirect;

    this.props.loading((done) => {
      request.get({
        url: '/auth-check'
      }, (err, resp) => {  // eslint-disable-line handle-callback-err
        if (resp.statusCode === 200) {
          if (redirectURL) {
            browser.go(redirectURL);
          } else {
            browser.push('/status');
          }
        }
        return done();
      });
    });
  }

  submitLoginOTP() {
    const redirectURL = browser.parseURL().query.redirect;

    this.props.loading((done) => {
      new Fingerprint().get((fingerprint) => {
        request.post({
          url: '/api/login/otp',
          json: {
            otp: this.otpInput.getValue(),
            fingerprint
          }
        }, (err, resp, loginStatus) => {  // eslint-disable-line handle-callback-err
          if (resp.statusCode === 200) {
            this.setState({isLoginComplete: true});
            if (redirectURL) {
              browser.go(redirectURL);
            } else {
              browser.push('/status');
            }
          }

          this.setState({loginStatus});
          return done();
        });
      });
    });
  }

  handleSubmitLogin(evt) {
    evt.preventDefault();

    this.submitLoginOTP();
  }

  render() {
    const {isLoading} = this.props;
    const {loginStatus, isLoginComplete} = this.state;

    const redirectURL = browser.parseURL().query.redirect;
    const redirectURLParsed = redirectURL && url.parse(redirectURL);

    return (
      <Container style={{paddingBottom: '24px'}}>
        <Helmet title={'OTP - auth.kevinlin.info'} />
        <Overlay isLoading={isLoading}>
          {
            !isLoginComplete && redirectURL && (
              <Alert
                type={ALERT_TYPE_WARN}
                className="margin--bottom"
                title="Your session must be authenticated."
                message={`Please login to access ${redirectURLParsed.host}.`}
              />
            )
          }

          {
            isLoginComplete && redirectURL && (
              <Alert
                type={ALERT_TYPE_SUCCESS}
                className="login-success-alert margin--bottom"
                title="Login success!"
                message={`Redirecting you to ${redirectURL}...`}
              />
            )
          }

          {
            loginStatus.message && (
              <Alert
                type={ALERT_TYPE_ERROR}
                className="login-error-alert margin--bottom"
                title="There was an error logging you in."
                message={loginStatus.message}
              />
            )
          }

          <form>
            <div className="margin-large--bottom">
              <p className="text--field-header">OTP</p>
              <input type="password" style={{display: 'none'}} />
              <TextField
                ref={(elem) => {
                  this.otpInput = elem;
                }}
                className="sans-serif iota"
                autoFocus={true}
                type="password"
              />
            </div>

            <Button
              text="Login"
              className="login-submit-btn sans-serif semibold iota"
              onClick={this.handleSubmitLogin.bind(this)}
              disabled={isLoading}
            />

            <div className="text-center margin--top">
              <Link
                className="sans-serif text-gray-40 lambda"
                to={{
                  pathname: '/login',
                  query: extend(browser.parseURL().query, {force: true})
                }}
              >
                DUO 2FA LOGIN
              </Link>
            </div>
          </form>
        </Overlay>
      </Container>
    );
  }
}

export default LoadingHOC(OTP);
