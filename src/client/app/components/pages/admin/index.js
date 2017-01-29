import Helmet from 'react-helmet';
import LoadingHOC from 'react-loading-hoc';
import React from 'react';

import AdminBlacklist from './admin-blacklist';
import AdminFingerprints from './admin-fingerprints';
import AdminU2F from './admin-u2f';
import Container from '../../layout/container';
import Overlay from '../../layout/overlay';

export const Admin = ({isLoading, ...props}) => (
  <Container>
    <Helmet title={'Admin - auth.kevinlin.info'} />
    <Overlay isLoading={isLoading}>
      <AdminBlacklist {...props} />
      <AdminU2F {...props} />
      <AdminFingerprints {...props} />
    </Overlay>
  </Container>
);

export default LoadingHOC(Admin);
