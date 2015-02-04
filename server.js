/*jshint -W117, -W030, -W016 */
/* global
 DEBUG:true,
 */

log = loglevel.createPackageLogger('[xolvio:webdriver]', process.env.WEBDRIVER_LOG_LEVEL || 'info');

wdio = {};

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {
  'use strict';

  if (process.env.NODE_ENV !== 'development' || process.env.VELOCITY === '0') {
    return;
  }

  var phantom = Npm.require('phantomjs'),
      freeport = Npm.require('freeport'),
      child_process = Npm.require('child_process').spawn;

  var defaultOptions = {
    desiredCapabilities: {browserName: 'PhantomJs'},
    logLevel: 'silent'
  };

  wdio.instance = Npm.require('webdriverio');

  wdio.getGhostDriver = Meteor.bindEnvironment(function (options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (wdio.driver) {
      callback(wdio.driver);
      return;
    }

    options = _.defaults(options, defaultOptions);

    freeport(Meteor.bindEnvironment(function (err, port) {
      options.port = port;
      _startPhantom(port, Meteor.bindEnvironment(function (childProcess) {
        wdio.driver = wdio.instance.remote(options);

        // kill this phantom with the parent
        if (options.parentProcess) {
          options.parentProcess.on('exit', function () {
            wdio.driver = null;
            childProcess.kill();
          });
        }

        callback(wdio.driver);
      }));
    }));

  });


  function _startPhantom (port, next) {

    var phantomChild = child_process(phantom.path, ['--ignore-ssl-errors', 'yes', '--webdriver', '' + port], {
        silent: true,
        cwd: process.env.PWD
      }
    );

    DEBUG && console.log('[xolvio:webdriver] Starting Phantom.');
    var onPhantomData = Meteor.bindEnvironment(function (data) {
      var stdout = data.toString();
      DEBUG && console.log('[xolvio:webdriver][phantom output]', stdout);
      if (stdout.match(/running/i)) {
        // always show this message
        console.log('[xolvio:webdriver] PhantomJS', port, 'is ready.');
        phantomChild.stdout.removeListener('data', onPhantomData);
        next(phantomChild);
      }
      else if (stdout.match(/Error/)) {
        console.error('[xolvio:webdriver] Error starting PhantomJS');
        next(new Error(data));
      }
    });
    phantomChild.stdout.on('data', onPhantomData);
  }

})();