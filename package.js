(function () {

  'use strict';

  Package.describe({
    name: 'xolvio:webdriver',
    summary: 'Webdriver.io for Meteor',
    version: '0.5.2',
    git: 'git@github.com:xolvio/meteor-webdriver.git',
    debugOnly: true
  });

  Npm.depends({
    'webdriverio': '2.4.5',
    'fs-extra': '0.12.0',
    'chromedriver': '2.14.1',
    'phantomjs-bin': '1.0.1'

    // TODO add support for these
    //'chai': '2.0.0',
    //'chai-as-promised': '4.2.0'
    //'selenium-standalone': '2.43.1-5',
  });

  Package.onUse(function (api) {
    api.use('underscore@1.0.2', 'server');
    api.use('coffeescript@1.0.4', 'server');

    api.addFiles([
      'lib/meteor/files.js',
      'server.js'
    ], 'server');
    api.addFiles(['lib/spawner.js'], 'server', {isAsset: true});

    // PhantomJS Polyfills
    api.add_files(['polyfills/url.js'], 'server', {isAsset: true});

    api.export('wdio', 'server');
  });

})();
