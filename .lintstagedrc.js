// lint-staged config — runs ESLint only on files being committed
// ESLint exits with code 1 on errors (blocks commit), code 0 on warnings only (allows commit)
// --max-warnings 9999 means: block ONLY on errors, warnings are shown but don't block

const path = require('path');
const ROOT = __dirname;

module.exports = {
  // Server JS files
  'server/**/*.js': (files) => {
    const rel = files
      .map(f => JSON.stringify(path.relative(path.join(ROOT, 'server'), f)))
      .join(' ');
    return `sh -c 'cd ${ROOT}/server && npx eslint --max-warnings 9999 ${rel}'`;
  },

  // Client JS/JSX files
  'client/src/**/*.{js,jsx}': (files) => {
    const rel = files
      .map(f => JSON.stringify(path.relative(path.join(ROOT, 'client'), f)))
      .join(' ');
    return `sh -c 'cd ${ROOT}/client && npx eslint --max-warnings 9999 ${rel}'`;
  },
};
