import Helmet from 'react-helmet';
import {Link} from 'react-router';
import React from 'react';
import request from 'browser-request';

import Container from './layout/container';

export default class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    request.get({
      url: '/auth-check'
    }, (err, resp) => {
      if (err) {
        // Safe to noop in this case; we want the response code to be set here regardless so that
        // logic later can handle it appropriately
      }
      this.setState({
        status: resp.statusCode
      });
    });
  }

  renderSuccessAlert() {
    return (
      <div className="session-authenticated status-box alert alert-done sans-serif light iota text-green">
        Your session is authenticated. Click <Link className="sans-serif text-green" to="/logout">here</Link> to logout.
      </div>
    );
  }

  renderFailureAlert() {
    return (
      <div className="session-not-authenticated status-box alert alert-error sans-serif light iota text-red">
        Your session is not authenticated. Please login <Link className="text-red sans-serif" to="/">here</Link>.
      </div>
    );
  }

  render() {
    let statusAlert;
    if (this.state.status === 200) {
      statusAlert = this.renderSuccessAlert();
    } else if (this.state.status) {
      statusAlert = this.renderFailureAlert();
    }

    return (
      <Container>
        <Helmet title={'Status - auth.kevinlin.info'} />
        {statusAlert}
      </Container>
    );
  }
}
