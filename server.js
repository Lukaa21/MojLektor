'use strict';

// Ensure venv node_modules are resolvable (CloudLinux NodeJS Selector)
if (process.env.NODE_PATH) {
  require('module').Module._initPaths();
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: false });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, () => {
    console.log('> API ready on port ' + PORT);
  });
});
