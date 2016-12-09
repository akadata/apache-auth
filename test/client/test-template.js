import fs from 'fs';
import test from 'tape';

test('Index template references CSS and JS files', (t) => {
  const template = fs.readFileSync('src/client/index.pug', 'utf8');

  t.ok(template.indexOf('/dist/main.css') !== -1, 'Template references /dist/main.css');
  t.ok(template.indexOf('/dist/bundle.js') !== -1, 'Template references /dist/bundle.js');
  t.ok(template.indexOf('/static/scripts/duo-web-v2.js') !== -1,
    'Template references Duo client library');
  t.ok(template.indexOf('/static/styles/siimple.min.css') !== -1,
    'Template references Siimple CSS framework');

  t.end();
});
