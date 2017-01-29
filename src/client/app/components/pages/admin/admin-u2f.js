import React from 'react';
import request from 'browser-request';

import Button from '../../ui/button';
import Table from '../../ui/table';

import browser from '../../../util/browser';

export default class AdminU2F extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      users: [],
      username: null
    };
  }

  componentDidMount() {
    this.loadSecurityKeyUsers();
  }

  loadSecurityKeyUsers() {
    request.post({
      url: '/api/admin/u2f/list',
      json: {}
    }, (err, resp, json) => {  // eslint-disable-line handle-callback-err
      this.setState({
        username: resp.getResponseHeader('X-Kiwi-User'),
        users: json.users
      });
    });
  }

  handleRegisterKeyClick(evt) {
    evt.preventDefault();

    const {username} = this.state;

    this.props.loading((done) => {
      request.post({
        url: '/api/admin/u2f/register-challenge',
        json: {username}
      }, this.onRegisterChallenge.bind(this, done));
    });
  }

  onRegisterChallenge(done, err, resp, json = {}) {
    if (err || resp.statusCode !== 200) {
      return done();
    }

    const {appId, version, challenge} = json;

    return browser.u2f.register(appId, [{version, challenge}], [],
      this.onU2FRegister.bind(this, done));
  }

  onU2FRegister(done, registerResponse) {
    const {username} = this.state;

    request.post({
      url: '/api/admin/u2f/register-verify',
      json: {username, registerResponse}
    }, () => {
      this.loadSecurityKeyUsers();
      return done();
    });
  }

  render() {
    const {users} = this.state;

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
          <Button
            className="trust-browser-btn sans-serif btn-outline iota"
            onClick={this.handleRegisterKeyClick.bind(this)}
            text="Register Security Key"
          />
        </div>

        <Table
          className="admin-table sans-serif kilo text-gray-70"
          headerClassName="sans-serif semibold"
          header={['USERNAME']}
          entries={users.map((user) => [user])}
        />
      </div>
    );
  }
}
