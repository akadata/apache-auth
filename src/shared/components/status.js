import Helmet from 'react-helmet';
import React from 'react';

import Container from './layout/container';

const Status = () => (
  <Container>
    <Helmet title={'Status - auth.kevinlin.info'} />
    <div className="status-box alert alert-done sans-serif light iota text-green">
      Your session is authenticated.
    </div>
  </Container>
);

export default Status;
