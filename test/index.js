require('babel-core/register');

require.extensions['.css'] = () => {};

module.exports = require('./main');
