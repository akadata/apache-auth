#!/bin/bash

set -ex

cp config/secrets.js.template config/secrets.js

gem install sass
npm-s3 install

npm run lint
npm run build
npm run cover
