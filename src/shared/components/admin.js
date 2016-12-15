/* global setTimeout */

import {browserHistory} from 'react-router';
import Helmet from 'react-helmet';
import humanize from 'humanize';
import React from 'react';
import request from 'browser-request';

import Container from './layout/container';
import Overlay from './layout/overlay';

export default class Admin extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      blacklistEntries: []
    };
  }

  componentDidMount() {
    request.post({
      url: '/api/blacklist-entries',
      json: {}
    }, (err, resp, body) => {
      this.setState({isLoading: false});

      if (err || (resp.statusCode !== 200)) {
        setTimeout(() => {
          browserHistory.push('/login');
        }, 2000);
        return this.setState({
          errorMessage: 'Your session must be authenticated to perform this request. ' +
            'Redirecting you now...'
        });
      }

      return this.setState({
        blacklistEntries: body.entries
      });
    });
  }

  renderFailureAlert() {
    const {errorMessage} = this.state;

    return errorMessage ? (
      <div className="blacklist-error alert alert-error sans-serif light iota text-red">
        {errorMessage}
      </div>
    ) : null;
  }

  render() {
    const {blacklistEntries} = this.state;

    return (
      <Container>
        <Helmet title={'Admin - auth.kevinlin.info'} />
        <Overlay opacity={this.state.isLoading ? 0.4 : 1}>
          {this.renderFailureAlert()}
          <p className="sans-serif semibold iota">BLACKLIST ENTRIES</p>
          <table className="table table-striped sans-serif kilo">
            <thead className="sans-serif semibold">
              <tr>
                <td>IP</td>
                <td>FAILED ATTEMPTS</td>
                <td>EXPIRY</td>
              </tr>
            </thead>
            <tbody>
              {
                blacklistEntries.map((entry) => (
                  <tr
                    key={`table-entry_${entry.ip}`}
                    className={`blacklist-entry ${entry.isBlacklisted ? 'alert-error text-red' : 'text-gray-70'}`}
                  >
                    <td>{entry.ip}</td>
                    <td>{entry.count}</td>
                    <td>{humanize.relativeTime(entry.expiry)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Overlay>
      </Container>
    );
  }
}
