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
  }
};

const config = extend(commonConfig, process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig);

export default config;
