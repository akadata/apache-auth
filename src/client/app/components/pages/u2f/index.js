import Check from 'react-icons/lib/md/check';
import Error from 'react-icons/lib/md/error';
import Fingerprint from 'fingerprintjs2';
import extend from 'deep-extend';
import Helmet from 'react-helmet';
import {Link} from 'react-router';
import LoadingHOC from 'react-loading-hoc';
import React from 'react';
import request from 'browser-request';
import Spinner from 'react-spinkit';
import url from 'url';

import Container from '../../layout/container';
import Overlay from '../../layout/overlay';

import Alert, {ALERT_TYPE_SUCCESS, ALERT_TYPE_WARN, ALERT_TYPE_ERROR} from '../../ui/alert';
import Button from '../../ui/button';
import TextField from '../../ui/text-field';

import browser from '../../../util/browser';
import authStatus from '../../../util/auth-status';

const STATUS_INITIALIZING = 'statusInitializing';
const STATUS_WAITING = 'statusWaiting';
const STATUS_VERIFYING = 'statusVerifying';
const STATUS_DONE = 'statusDone';
const STATUS_ERROR = 'statusError';

export class U2F extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loginStatus: {},
      u2fStatus: STATUS_INITIALIZING
    };
  }

  componentDidMount() {
    // TODO uncomment for prod
    // authStatus.redirectIfAuthenticated(this.props.loading);

    this.requestAuthChallenge();
  }

  requestAuthChallenge() {
    const redirectURL = browser.parseURL().query.redirect;

    new Fingerprint().get((fingerprint) => {
      request.post({
        url: '/api/login/u2f/challenge',
        json: {fingerprint}
      }, (challengeErr, challengeResp, {appId, challenge, version, keyHandle}) => {
        this.setState({u2fStatus: STATUS_WAITING});

        window.u2f.sign(appId, challenge, [{version, keyHandle}], (authResponse) => {
          this.setState({u2fStatus: STATUS_VERIFYING});

          request.post({
            url: '/api/login/u2f/verify',
            json: {fingerprint, authResponse}
          }, (verifyErr, verifyResp, loginStatus) => {
            this.setState({
              u2fStatus: loginStatus.success ? STATUS_DONE : STATUS_ERROR,
              loginStatus
            });

            return redirectURL ? browser.go(redirectURL) : browser.push('/status');
          });
        });
      });
    });
  }

  render() {
    const {isLoading} = this.props;
    const {u2fStatus, loginStatus} = this.state;

    const redirectURL = browser.parseURL().query.redirect;
    const redirectURLParsed = redirectURL && url.parse(redirectURL);

    const statusIcons = {
      [STATUS_DONE]: <Check className="u2f-icon text-green margin--right" />,
      [STATUS_ERROR]: <Error className="u2f-icon text-red margin--right" />
    };
    const statusMessages = {
      [STATUS_INITIALIZING]: 'Initializing authentication...',
      [STATUS_WAITING]: 'Waiting for token...',
      [STATUS_VERIFYING]: 'Verifying login...',
      [STATUS_DONE]: 'Done!',
      [STATUS_ERROR]: 'Validation error!'
    };

    return (
      <Container style={{paddingBottom: '24px'}}>
        <Helmet title={'U2F - auth.kevinlin.info'} />
        <Overlay isLoading={isLoading}>
          {
            (u2fStatus !== STATUS_DONE) && redirectURL && (
              <Alert
                type={ALERT_TYPE_WARN}
                className="margin--bottom"
                title="Your session must be authenticated."
                message={`Please login to access ${redirectURLParsed.host}.`}
              />
            )
          }

          {
            (u2fStatus === STATUS_DONE) && redirectURL && (
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

          <div className="text-center">
            <p className="sans-serif gamma text-gray-70 margin--bottom">
              Touch your U2F security key to login.
            </p>

            <div className="u2f-progress">
              {
                statusIcons[u2fStatus] || (
                  <Spinner
                    spinnerName="pulse"
                    overrideSpinnerClassName="u2f-icon margin--right"
                    noFadeIn
                  />
                )
              }
              <span className="u2f-status-text sans-serif text-gray-60 kilo">
                {statusMessages[u2fStatus].toUpperCase()}
              </span>
            </div>
          </div>

          <div className="text-center margin-large--top">
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
        </Overlay>
      </Container>
    );
  }
}

export default LoadingHOC(U2F);
