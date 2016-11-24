import Helmet from 'react-helmet';
import React from 'react';
import request from 'browser-request';

import Container from './layout/container';
import Overlay from './layout/overlay';

export default class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false
    };
  }

  submitLogin() {
    this.setState({
      isLoading: true
    });

    request.post({
      url: '/auth-user',
      formData: {
        /* eslint-disable camelcase */
        httpd_username: this.state.username,
        httpd_password: this.state.password
        /* eslint-enable camelcase */
      }
    }, (err, resp) => {
      if (err) {
        this.setState({
          isLoading: false,
          status: 500
        });
      } else {
        this.setState({
          isLoading: false,
          status: resp.statusCode
        });
      }
    });
  }

  setText(key, evt) {
    this.setState({
      [key]: evt.target.value
    });
  }

  renderSuccessAlert() {
    return (
      <div className="alert alert-done sans-serif light iota text-green">
        Login successful! Please reload the target page.
      </div>
    );
  }

  renderFailureAlert() {
    return (
      <div className="alert alert-error sans-serif light iota text-red">
        The username/password combination is incorrect. Please try again.
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
        <Helmet title={'Login - auth.kevinlin.info'} />
        <Overlay opacity={this.state.isLoading ? 0.4 : 1}>
          {statusAlert}
          <input
            type="text"
            className="login-field form-input sans-serif light iota"
            placeholder="Username"
            onChange={this.setText.bind(this, 'username')}
          />
          <input
            type="password"
            className="login-field form-input sans-serif light iota"
            placeholder="Password"
            onChange={this.setText.bind(this, 'password')}
          />
          <div
            className="login-btn btn sans-serif iota text-white"
            onClick={this.submitLogin.bind(this)}
          >
            LOG IN
          </div>
        </Overlay>
      </Container>
    );
  }
}
