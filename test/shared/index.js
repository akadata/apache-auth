import path from 'path';
import recursive from 'recursive-readdir';

import './components';

// Import all known UI components as part of the test simply to ensure that they appear in the
// test coverage report, even if those components have zero coverage.
recursive(
  path.join(__dirname, '../../src'),
  [(filePath, stats) => {
    // Criteria for ignoring this file
    const isClient = filePath.indexOf('src/client') !== -1;
    const isNotSource = !filePath.endsWith('.js') && !stats.isDirectory();
    const isServer = filePath.endsWith('src/server/index.js');
    return isClient || isNotSource || isServer;
  }],
  (err, files) => {
    if (err) {
      throw err;
    }

    files.forEach(require);
  }
);
