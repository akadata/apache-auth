import Duo from 'react-duo-web';
import Helmet from 'react-helmet';
import LoadingHOC from 'react-loading-hoc';
import React from 'react';
import request from 'browser-request';

import Container from '../../layout/container';
import Overlay from '../../layout/overlay';

import Alert, {ALERT_TYPE_SUCCESS, ALERT_TYPE_ERROR} from '../../ui/alert';
import Button from '../../ui/button';
import TextField from '../../ui/text-field';

import browser from '../../../util/browser';

class Login extends React.Component {
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

  submitLoginDuo() {
    this.props.loading((done) => {
      request.post({
        url: '/api/login/duo',
        json: {
          username: this.usernameInput.getValue(),
          password: this.passwordInput.getValue()
        }
      }, (err, resp, loginStatus) => {
        this.setState({loginStatus});
        return done();
      });
    });
  }

  submitLoginApache(sigResponse) {
    const redirectURL = browser.parseURL().query.redirect;

    this.props.loading((done) => {
      request.post({
        url: '/api/login/apache',
        json: {
          username: this.usernameInput.getValue(),
          password: this.passwordInput.getValue(),
          sigResponse
        }
      }, (err, resp, loginStatus) => {
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
  }

  handleSubmitLogin(evt) {
    evt.preventDefault();

    this.submitLoginDuo();
  }

  onDuoResp(sigResponse) {
    this.submitLoginApache(sigResponse);
  }

  render() {
    const {isLoading} = this.props;
    const {loginStatus, isLoginComplete} = this.state;

    const redirectURL = browser.parseURL().query.redirect;

    return (
      <Container>
        <Helmet title={'Login - auth.kevinlin.info'} />
        <Overlay isLoading={isLoading}>
          {
            isLoginComplete && redirectURL && (
              <Alert
                type={ALERT_TYPE_SUCCESS}
                className="margin--bottom"
                title="Login success!"
                message={`Redirecting you to ${redirectURL}...`}
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
              className="sans-serif semibold iota"
              onClick={this.handleSubmitLogin.bind(this)}
              disabled={isLoading || loginStatus.sigRequest}
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
    );
  }
}

export default LoadingHOC(Login);
