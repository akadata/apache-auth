import Fingerprint from 'fingerprintjs2';
import React from 'react';
import request from 'browser-request';

import Button from '../../ui/button';
import Table from '../../ui/table';
import TextField from '../../ui/text-field';

export default class AdminFingerprints extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fingerprints: []
    };
  }

  componentDidMount() {
    this.loadBrowserFingerprints();
  }

  loadBrowserFingerprints() {
    this.props.loading((done) => request.get({
      url: '/api/admin/fingerprint/list',
      json: {}
    }, (err, resp, json) => {
      if (err || resp.statusCode !== 200) {
        this.setState({errorMessage: json.error});
        return done();
      }

      this.setState({fingerprints: json.fingerprints});
      return done();
    }));
  }

  revokeFingerprint(id) {
    this.props.loading((done) => request({
      url: '/api/admin/fingerprint/revoke',
      method: 'DELETE',
      json: {id}
    }, () => {
      this.loadBrowserFingerprints();
      return done();
    }));
  }

  handleTrustThisBrowserClick(evt) {
    evt.preventDefault();

    new Fingerprint().get((fingerprint) => {
      request.put({
        url: '/api/admin/fingerprint/add',
        json: {
          name: this.browserName.getValue(),
          fingerprint,
          username: 'kiwi'  // TODO
        }
      }, this.loadBrowserFingerprints.bind(this));
    });
  }

  renderFailureAlert() {
    const {errorMessage} = this.state;

    return errorMessage ? (
      <div className="fingerprints-error-alert alert alert-error sans-serif light iota text-red">
        {errorMessage}
      </div>
    ) : null;
  }

  render() {
    const {fingerprints} = this.state;

    return (
      <div>
        {this.renderFailureAlert()}
        <div className="margin--bottom">
          <p className="sans-serif semibold iota text-gray-70 margin-tiny--bottom">
            BROWSER FINGERPRINTS
          </p>
          <p className="sans-serif light kilo text-gray-70">
            Only OTP authentication requests from these trusted browsers will be allowed.
          </p>
        </div>

        <div className="margin--bottom">
          <TextField
            ref={(elem) => {
              this.browserName = elem;
            }}
            type="text"
            className="form-input sans-serif light iota margin-small--bottom"
            placeholder="Browser identifier"
          />
          <Button
            className="trust-browser-btn sans-serif btn-outline iota"
            onClick={this.handleTrustThisBrowserClick.bind(this)}
            text="Trust this Browser"
          />
        </div>

        <Table
          className="admin-table sans-serif kilo text-gray-70"
          headerClassName="sans-serif semibold"
          header={[
            'NAME',
            <div className="text-right">ACTIONS</div>
          ]}
          entries={fingerprints.map((fingerprint) => [
            fingerprint.name,
            <div className="text-right">
              <Button
                className="fingerprint-revoke-btn bg-red sans-serif kilo"
                text="Revoke"
                onClick={(evt) => {
                  evt.preventDefault();

                  this.revokeFingerprint(fingerprint._id);
                }}
                style={{
                  width: '100px'
                }}
              />
            </div>
          ])}
        />
      </div>
    );
  }
}
