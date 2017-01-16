import Helmet from 'react-helmet';
import React from 'react';

import Container from '../../layout/container';

import Alert, {ALERT_TYPE_ERROR} from '../../ui/alert';

const Blacklist = () => (
  <Container>
    <Helmet title={'Blacklisted - auth.kevinlin.info'} />
    <Alert
      type={ALERT_TYPE_ERROR}
      title="Your IP address is blacklisted."
      message="Further authentication attempts are forbidden."
    />
  </Container>
);

export default Blacklist;
