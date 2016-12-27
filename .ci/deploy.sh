#!/usr/bin/env bash

set -ex

cd ${REPO_DIR}

git fetch --all
git checkout ${BRANCH}
git reset --hard origin/${BRANCH}

npm install
npm run build

pm2 stop apache-auth || :
pm2 start index.js --name apache-auth
pm2 show apache-auth
