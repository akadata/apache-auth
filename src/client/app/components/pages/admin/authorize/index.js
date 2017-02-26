import Helmet from 'react-helmet';
import humanize from 'humanize';
import LoadingHOC from 'react-loading-hoc';
import React from 'react';
import request from 'browser-request';

import Container from '../../../layout/container';
import Overlay from '../../../layout/overlay';

import Alert, {ALERT_TYPE_SUCCESS, ALERT_TYPE_ERROR} from '../../../ui/alert';
import Button from '../../../ui/button';

export class AdminAuthorize extends React.Component {
  constructor(props) {
    super(props);

    this.authorizationID = props.params.authorizationID;
    this.state = {
      details: {},
      status: null
    };
  }

  componentDidMount() {
    this.authorizationDetails();
  }

  authorizationDetails() {
    request.post({
      url: '/api/admin/authorize/details',
      json: {authorizationID: this.authorizationID}
    }, (err, resp, json = {}) => {
      if (err || resp.statusCode !== 200) {
        return this.setState({
          status: {
            type: ALERT_TYPE_ERROR,
            title: 'Error fetching authorization details!',
            message: 'Please try again.'
          }
        });
      }

      return this.setState({
        details: json.details,
        username: resp.getResponseHeader && resp.getResponseHeader('X-Kiwi-User')
      });
    });
  }

  handleSubmitAuthorizeShort(evt) {
    evt.preventDefault();

    this.authorizeRequest(1);
  }

  handleSubmitAuthorizeLong(evt) {
    evt.preventDefault();

    this.authorizeRequest(30);
  }

  authorizeRequest(duration) {
    this.props.loading((done) => {
      request.post({
        url: '/api/admin/authorize/grant',
        json: {
          authorizationID: this.authorizationID,
          username: this.state.username,
          duration
        }
      }, (err, resp, json = {}) => {
        if (err || resp.statusCode !== 200) {
          this.setState({
            status: {
              type: ALERT_TYPE_ERROR,
              title: 'There was an error authorizing this request.',
              message: json.message
            }
          });
        } else {
          this.setState({
            status: {
              type: ALERT_TYPE_SUCCESS,
              title: 'Request authorized!',
              message: `A session cookie was granted with an expiry of ${duration} minutes.`
            }
          });
        }

        return done();
      });
    });
  }

  handleSubmitReject(evt) {
    evt.preventDefault();

    this.props.loading((done) => {
      request.post({
        url: '/api/admin/authorize/reject',
        json: {authorizationID: this.authorizationID}
      }, (err, resp, json = {}) => {
        if (err || resp.statusCode !== 200) {
          this.setState({
            status: {
              type: ALERT_TYPE_ERROR,
              title: 'There was an error rejecting this request.',
              message: json.message
            }
          });
        } else {
          this.setState({
            status: {
              type: ALERT_TYPE_SUCCESS,
              title: 'Request rejected and IP blacklisted.',
              message: 'Further login attempts from this IP are blacklisted.'
            }
          });
        }

        return done();
      });
    });
  }

  renderDetailsEntry(header, text) {
    return (
      <div className="margin-small--bottom">
        <p className="sans-serif iota text-gray-60 margin-tiny--bottom">
          {header.toUpperCase()}
        </p>
        <p className="sans-serif kilo text-gray-70">
          {text}
        </p>
      </div>
    );
  }

  render() {
    const {isLoading} = this.props;
    const {details, status} = this.state;

    const timestamp = humanize.date('l, F j g:i:s A', details.timestamp / 1000);
    const timestampRelative = humanize.relativeTime(details.timestamp / 1000);
    const expiry = humanize.date('l, F j g:i:s A', details.expiry / 1000);
    const expiryRelative = humanize.relativeTime(details.expiry / 1000);

    return (
      <Container>
        <Helmet title={'Admin - auth.kevinlin.info'} />
        <Overlay isLoading={isLoading}>
          {
            status && (
              <Alert
                type={status.type}
                className="margin--bottom"
                title={status.title}
                message={status.message}
              />
            )
          }

          <p className="sans-serif gamma text-gray-70 margin--bottom">
            Authorize this request?
          </p>

          <div className="margin-huge--bottom">
            {this.renderDetailsEntry('Fingerprint', details.fingerprint)}
            {this.renderDetailsEntry('IP Address', details.ip)}
            {this.renderDetailsEntry('User Agent', details.userAgent)}
            {this.renderDetailsEntry('Scope', details.scope)}
            {this.renderDetailsEntry('Timestamp', `${timestamp} (${timestampRelative})`)}
            {this.renderDetailsEntry('Expiry', `${expiry} (${expiryRelative})`)}
          </div>

          <Button
            text="Authorize (1 min)"
            className="authorize-short-submit-btn sans-serif semibold iota margin-small--bottom"
            onClick={this.handleSubmitAuthorizeShort.bind(this)}
          />
          <Button
            text="Authorize (30 min)"
            className="authorize-long-submit-btn sans-serif semibold iota margin-small--bottom"
            onClick={this.handleSubmitAuthorizeLong.bind(this)}
          />
          <Button
            text="Reject and Blacklist"
            className="reject-submit-btn sans-serif semibold iota bg-red"
            onClick={this.handleSubmitReject.bind(this)}
          />
        </Overlay>
      </Container>
    );
  }
}

export default LoadingHOC(AdminAuthorize);
