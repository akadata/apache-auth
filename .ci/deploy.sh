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

curl -X POST https://allu.internal.kevinlin.info/api/notify/text -d '{"tag": "Jenkins", "messageText": "Successfully deployed apache-auth ('"$(git branch | cut -c 3-)"', '"$(git sha)"')."}'
