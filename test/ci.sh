set -ex

cp config/secrets.js.template config/secrets.jsa
npm run lint
npm run build
npm run cover
