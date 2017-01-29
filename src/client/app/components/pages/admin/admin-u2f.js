import React from 'react';
import request from 'browser-request';

import Button from '../../ui/button';
import TextField from '../../ui/text-field';

export default class AdminU2F extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fingerprints: []
    };
  }

  handleRegisterKeyClick(evt) {
    evt.preventDefault();

    const username = this.username.getValue();

    this.props.loading((done) => {
      request.post({
        url: '/api/admin/u2f/register-challenge',
        json: {username}
      }, (challengeErr, challengeResp, {appId, version, challenge}) => {
        window.u2f.register(appId, [{version, challenge}], [], (registerResponse) => {
          request.post({
            url: '/api/admin/u2f/register-verify',
            json: {username, registerResponse}
          }, (verifyErr, verifyResp, verifyJSON) => {
            console.log(verifyJSON);
            return done();
          });
        });
      });
    });
  }

  render() {
    return (
      <div className="margin-large--bottom">
        <div className="margin--bottom">
          <p className="sans-serif semibold iota text-gray-70 margin-tiny--bottom">
            SECURITY KEYS
          </p>
          <p className="sans-serif light kilo text-gray-70">
            Register a U2F security key.
          </p>
        </div>

        <div className="margin--bottom">
          <form>
            <TextField
              ref={(elem) => {
                this.username = elem;
              }}
              type="text"
              className="form-input sans-serif light iota margin-small--bottom"
              placeholder="Username"
            />
            <Button
              className="trust-browser-btn sans-serif btn-outline iota"
              onClick={this.handleRegisterKeyClick.bind(this)}
              text="Register Security Key"
            />
          </form>
        </div>
      </div>
    );
  }
}
