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

allu \
    --skip-auth \
    --type text \
    --tag Jenkins \
    --message "Successfully deployed apache-auth ("$(git rev-parse --abbrev-ref HEAD)", "$(git sha)")."
