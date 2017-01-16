import Helmet from 'react-helmet';
import {Link} from 'react-router';
import React from 'react';
import request from 'browser-request';

import Container from '../../layout/container';

import Alert, {ALERT_TYPE_SUCCESS, ALERT_TYPE_ERROR} from '../../ui/alert';

export default class Status extends React.Component {
  constructor(props) {
    super(props);

    this.state = {status: null};
  }

  componentDidMount() {
    request.get({
      url: '/auth-check'
    }, (err, resp) => {  // eslint-disable-line handle-callback-err
      this.setState({status: resp.statusCode});
    });
  }

  renderSuccessAlert() {
    return (
      <Alert
        type={ALERT_TYPE_SUCCESS}
        className="session-authenticated"
        title="Your session is authenticated."
        message={
          <span>
            Click <Link className="sans-serif semibold" to="/logout">here</Link> to logout.
          </span>
        }
      />
    );
  }

  renderFailureAlert() {
    return (
      <Alert
        type={ALERT_TYPE_ERROR}
        className="session-not-authenticated"
        title="Your session is not authenticated."
        message={
          <spam>
            Please login <Link className="sans-serif semibold" to="/">here</Link>.
          </spam>
        }
      />
    );
  }

  render() {
    const {status} = this.state;

    const statusAlert = (() => {
      if (status === 200) {
        return this.renderSuccessAlert();
      } else if (status) {
        return this.renderFailureAlert();
      }
      return null;
    })();

    return (
      <Container>
        <Helmet title={'Status - auth.kevinlin.info'} />
        {statusAlert}
      </Container>
    );
  }
}
