import Helmet from 'react-helmet';
import {Link} from 'react-router';
import React from 'react';
import request from 'browser-request';

import Container from '../../layout/container';

import Alert, {ALERT_TYPE_SUCCESS, ALERT_TYPE_ERROR} from '../../ui/alert';

export default class Logout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {status: null};
  }

  componentDidMount() {
    request.post({
      url: '/api/logout/logout'
    }, (err, resp) => {  // eslint-disable-line handle-callback-err
      this.setState({status: resp.statusCode});
    });
  }

  renderSuccessAlert() {
    return (
      <Alert
        type={ALERT_TYPE_SUCCESS}
        title="You have been logged out."
        message={
          <span>
            Click <Link className="sans-serif semibold" to="/login">here</Link> to login.
          </span>
        }
      />
    );
  }

  renderFailureAlert() {
    return (
      <Alert
        type={ALERT_TYPE_ERROR}
        title="There was an error logging you out."
        message="Please try again."
      />
    );
  }

  render() {
    const {status} = this.state;

    const logoutAlert = (() => {
      if (status === 200) {
        return this.renderSuccessAlert();
      } else if (status) {
        return this.renderFailureAlert();
      }
      return null;
    })();

    return (
      <Container>
        <Helmet title={'Logout - auth.kevinlin.info'} />
        {logoutAlert}
      </Container>
    );
  }
}
