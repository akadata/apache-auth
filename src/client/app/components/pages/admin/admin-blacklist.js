import humanize from 'humanize';
import React from 'react';
import request from 'browser-request';

import Alert, {ALERT_TYPE_ERROR} from '../../ui/alert';
import Table from '../../ui/table';

import browser from '../../../util/browser';

export default class AdminBlacklist extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      blacklistEntries: []
    };
  }

  componentDidMount() {
    this.loadBlacklistEntries();
  }

  loadBlacklistEntries() {
    this.props.loading((done) => request.get({
      url: '/api/admin/blacklist/list',
      json: {}
    }, (err, resp, body) => {
      if (err || (resp.statusCode !== 200)) {
        browser.push('/login', 2000);
        done();
        return this.setState({
          errorMessage: 'Your session must be authenticated to perform this request. ' +
          'Redirecting you now...'
        });
      }

      done();
      return this.setState({blacklistEntries: body.entries});
    }));
  }

  renderFailureAlert() {
    const {errorMessage} = this.state;

    return errorMessage ? (
      <Alert
        type={ALERT_TYPE_ERROR}
        className="margin--bottom"
        title="There was an error loading details."
        message={errorMessage}
      />
    ) : null;
  }

  render() {
    const {blacklistEntries} = this.state;

    return (
      <div className="margin-large--bottom">
        {this.renderFailureAlert()}
        <p className="sans-serif semibold iota text-gray-70 margin-tiny--bottom">BLACKLIST ENTRIES</p>
        <Table
          className="admin-table sans-serif kilo text-gray-70"
          headerClassName="sans-serif semibold kilo"
          header={[
            'IP',
            'ATTEMPTS',
            'EXPIRY'
          ]}
          entries={blacklistEntries.map((entry) => [
            <span className={`blacklist-entry ${entry.isBlacklisted ? 'alert-error text-red' : 'text-gray-70'}`}>
              {entry.ip}
            </span>,
            <span className={`blacklist-entry ${entry.isBlacklisted ? 'alert-error text-red' : 'text-gray-70'}`}>
              {entry.count}
            </span>,
            <span className={`blacklist-entry ${entry.isBlacklisted ? 'alert-error text-red' : 'text-gray-70'}`}>
              {humanize.relativeTime(entry.expiry)}
            </span>
          ])}
          style={{
            tableLayout: 'fixed',
            width: '100%'
          }}
        />
      </div>
    );
  }
}
