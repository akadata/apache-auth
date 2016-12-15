import Helmet from 'react-helmet';
import React from 'react';

import Container from './layout/container';

const Blacklist = () => (
  <Container>
    <Helmet title={'Blacklisted - auth.kevinlin.info'} />
    <div className="blacklist-alert alert alert-error sans-serif light iota text-red margin--none">
      Your IP address has been blacklisted from all authentication attempts.
    </div>
  </Container>
);

export default Blacklist;
