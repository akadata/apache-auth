import Helmet from 'react-helmet';
import React from 'react';
import request from 'browser-request';

import Container from './layout/container';

export default class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    request.post({
      url: '/api/logout'
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
      <div className="status-box alert sans-serif light iota text-blue">
        You have been logged out.
      </div>
    );
  }

  renderFailureAlert() {
    return (
      <div className="status-box alert alert-error sans-serif light iota text-red">
        There was an error logging you out.
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
        <Helmet title={'Logout - auth.kevinlin.info'} />
        {statusAlert}
      </Container>
    );
  }
}
