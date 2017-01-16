import Helmet from 'react-helmet';
import LoadingHOC from 'react-loading-hoc';
import React from 'react';

import AdminBlacklist from './admin-blacklist';
import AdminFingerprints from './admin-fingerprints';
import Container from '../../layout/container';
import Overlay from '../../layout/overlay';

const Admin = ({isLoading, ...props}) => (
  <Container>
    <Helmet title={'Admin - auth.kevinlin.info'} />
    <Overlay isLoading={isLoading}>
      <AdminBlacklist {...props} />
      <AdminFingerprints {...props} />
    </Overlay>
  </Container>
);

export default LoadingHOC(Admin);
