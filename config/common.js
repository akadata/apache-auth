import extend from 'deep-extend';

import developmentConfig from './development';
import productionConfig from './production';

/**
 * Configuration options common to all environments.
 */
const commonConfig = {
  // Application properties
  app: {
    name: 'apache-auth',
    title: 'apache auth',
    port: 18800
  },
  blacklist: {
    // The duration of each IP blacklist
    TTL: 24 * 60 * 60 * 1000,
    // The maximum number of failed login attempts to blacklist the IP
    maxFailedAttempts: 0
  }
};

const config = extend(commonConfig, process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig);

export default config;
