import fs from 'fs';
import test from 'tape';

test('Index template references CSS and JS files', (t) => {
  const template = fs.readFileSync('src/client/templates/index.pug', 'utf8');

  t.ok(template.indexOf('/static/dist/main.css') !== -1,
    'Template references /static/dist/main.css');
  t.ok(template.indexOf('/static/dist/bundle.js') !== -1,
    'Template references /static/dist/bundle.js');

  t.end();
});

test('Blacklist template references CSS and JS files', (t) => {
  const template = fs.readFileSync('src/client/templates/blacklist.pug', 'utf8');

  t.ok(template.indexOf('/static/dist/main.css') !== -1,
    'Template references /static/dist/main.css');
  t.ok(template.indexOf('/static/dist/blacklist.js') !== -1,
    'Template references /static/dist/blacklist.js');

  t.end();
});
