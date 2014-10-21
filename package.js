Package.describe({
  name: 'xolvio:webdriver',
  summary: 'Webdriver for Velocity',
  version: '0.0.1',
  git: 'git@github.com:xolvio/meteor-webdriver.git',
  debugOnly: true
});

Npm.depends({
  'webdriverio': '2.2.3',
  'wd': '0.3.9',
  'selenium-webdriver': '2.43.5',
  'selenium-standalone': '2.43.1-5',
  'jasmine-core': '2.0.0',
  'mocha': '1.17.1',
  'chai': '1.9.0'
});

Package.onUse(function (api) {
  api.use(['velocity:core@0.2.14'], "server");
  api.use(['templating'], "client");

  api.addFiles(['server.js'], 'server');
});
