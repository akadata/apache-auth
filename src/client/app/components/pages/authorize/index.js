/* global setInterval */

import Check from 'react-icons/lib/md/check';
import Error from 'react-icons/lib/md/error';
import Helmet from 'react-helmet';
import LoadingHOC from 'react-loading-hoc';
import React from 'react';
import request from 'browser-request';
import Spinner from 'react-spinkit';
import url from 'url';

import Container from '../../layout/container';
import Overlay from '../../layout/overlay';

import Alert, {ALERT_TYPE_SUCCESS, ALERT_TYPE_WARN, ALERT_TYPE_ERROR} from '../../ui/alert';

import browser from '../../../util/browser';
import authStatus from '../../../util/auth-status';

const STATUS_INITIALIZING = 'statusInitializing';
const STATUS_WAITING = 'statusWaiting';
const STATUS_DONE = 'statusDone';
const STATUS_ERROR = 'statusError';

export class Authorize extends React.Component {
  constructor(props) {
    super(props);

    this.redirectURL = browser.parseURL().query.redirect;
    this.redirectURLParsed = this.redirectURL && url.parse(this.redirectURL);
    this.state = {authorizationStatus: STATUS_INITIALIZING};
  }

  componentDidMount() {
    authStatus.redirectIfAuthenticated(this.props.loading, this.requestAuthorization.bind(this));
  }

  requestAuthorization() {
    if (!this.redirectURL) {
      return this.setState({authorizationStatus: STATUS_ERROR});
    }

    return browser.fingerprint((fingerprint) => {
      request.post({
        url: '/api/login/authorize/request',
        json: {
          fingerprint,
          scope: this.redirectURLParsed.host
        }
      }, this.onAuthorizationRequested.bind(this));
    });
  }

  onAuthorizationRequested(err, resp, requestStatus = {}) {
    if (err || resp.statusCode !== 200) {
      return this.setState({authorizationStatus: STATUS_ERROR});
    }

    this.setState({authorizationStatus: STATUS_WAITING});

    return setInterval(this.pollAuthorizationStatus.bind(this, requestStatus.authorizationID),
      1000);
  }

  pollAuthorizationStatus(authorizationID) {
    browser.fingerprint((fingerprint) => {
      request.post({
        url: '/api/login/authorize/check',
        json: {authorizationID, fingerprint}
      }, this.onAuthorizationCheck.bind(this));
    });
  }

  onAuthorizationCheck(_, resp = {}) {
    if (resp.statusCode === 200) {
      this.setState({authorizationStatus: STATUS_DONE});
      browser.go(this.redirectURL);
    }
  }

  render() {
    const {isLoading} = this.props;
    const {authorizationStatus} = this.state;

    const redirectURL = browser.parseURL().query.redirect;
    const redirectURLParsed = redirectURL && url.parse(redirectURL);

    const statusIcons = {
      [STATUS_DONE]: <Check className="u2f-icon text-green margin--right" />,
      [STATUS_ERROR]: <Error className="u2f-icon text-red margin--right" />
    };
    const statusMessages = {
      [STATUS_INITIALIZING]: 'Initializing authorization...',
      [STATUS_WAITING]: 'Waiting for authorization...',
      [STATUS_DONE]: 'Done!',
      [STATUS_ERROR]: 'Error!'
    };

    return (
      <Container style={{paddingBottom: '24px'}}>
        <Helmet title={'Authorization Request - auth.kevinlin.info'} />
        <Overlay isLoading={isLoading}>
          {
            (authorizationStatus !== STATUS_DONE) && redirectURL && (
              <Alert
                type={ALERT_TYPE_WARN}
                className="margin--bottom"
                title="Your session must be authenticated."
                message={
                  `An authorization request has been dispatched for ${redirectURLParsed.host}.`
                }
              />
            )
          }

          {
            (authorizationStatus === STATUS_DONE) && redirectURL && (
              <Alert
                type={ALERT_TYPE_SUCCESS}
                className="login-success-alert margin--bottom"
                title="Authorization success!"
                message={`Redirecting you to ${redirectURL}...`}
              />
            )
          }

          {
            (authorizationStatus === STATUS_ERROR) && (
              <Alert
                type={ALERT_TYPE_ERROR}
                className="login-success-alert margin--bottom"
                title="Authorization error!"
                message="Please try the authorization request again."
              />
            )
          }

          <div className="authorize-status text-center margin--bottom">
            <div className="u2f-progress">
              {
                statusIcons[authorizationStatus] || (
                  <Spinner
                    spinnerName="pulse"
                    overrideSpinnerClassName="u2f-icon margin--right"
                    noFadeIn
                  />
                )
              }
              <span className="u2f-status-text sans-serif text-gray-60 kilo">
                {statusMessages[authorizationStatus].toUpperCase()}
              </span>
            </div>
          </div>
        </Overlay>
      </Container>
    );
  }
}

export default LoadingHOC(Authorize);
