/*jshint -W117, -W030, -W016 */
/* global
 DEBUG:true,
 sanjo3:true
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
      path = Npm.require('path'),
      _screenshotCounter;

  var defaultOptions = {
    desiredCapabilities: {browserName: 'PhantomJs'},
    port: 4444,
    logLevel: 'silent',
    implicitWait: 5000
  };

  wdio.instance = Npm.require('webdriverio');

  wdio.getGhostDriver = function (options, callback) {

    _screenshotCounter = 0;

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = _.defaults(options, defaultOptions);

    DEBUG && console.log('[xolvio:webdriver]', 'getGhostDriver called');
    _startPhantom(options.port, function () {
      var browser = wdio.instance.remote(options);
      _augmentedBrowser(browser, options);
      callback(browser);
    });
  };

  function _augmentedBrowser (browser, options) {
    browser.
      addCommand('waitForPresent', function (selector, cb) {
        this
          .waitForExist(selector, options.implicitWait)
          .waitForVisible(selector, options.implicitWait)
          .call(cb);
      }).
      addCommand('waitForAndClick', function (selector, cb) {
        this
          .waitForPresent(selector)
          .click(selector)
          .call(cb);
      }).
      addCommand('type', function (selector, value, cb) {
        this
          .click(selector)
          .keys(value)
          .call(cb);
      }).
      addCommand('takeScreenshot', function (filename, cb) {
        if (typeof filename === 'function') {
          cb = filename;
          filename = 'screenshot' + ++_screenshotCounter + '.png';
        }
        if (!filename.match(/\.png$/)) {
          filename += '.png';
        }
        var ssPath = path.join(process.env.PWD, filename);
        this
          .saveScreenshot(ssPath).
          call(function (e, r) {
            console.log('Saved screenshot to', ssPath);
            cb();
          });
      });
  }


  function _startPhantom (port, next) {

    var phantomChild = new sanjo3.LongRunningChildProcess('webdriver-phantom');
    if (phantomChild.isRunning()) {
      DEBUG && console.log('[xolvio:webdriver] Phantom is already running, not starting a new one');
      next();
      return;
    }

    phantomChild.spawn({
      command: phantom.path,
      args: ['--ignore-ssl-errors', 'yes', '--webdriver', '' + port],
      options: {
        silent: true,
        detached: true,
        cwd: process.env.PWD
      }
    });

    DEBUG && console.log('[xolvio:webdriver] Starting Phantom.');
    var onPhantomData = Meteor.bindEnvironment(function (data) {
      var stdout = data.toString();
      DEBUG && console.log('[xolvio:webdriver][phantom output]', stdout);
      if (stdout.match(/running/i)) {
        // always show this message
        console.log('[xolvio:webdriver] PhantomJS started.');
        phantomChild.getChild().stdout.removeListener('data', onPhantomData);
        next();
      }
      else if (stdout.match(/Error/)) {
        console.error('[xolvio:webdriver] Error starting PhantomJS');
        next(new Error(data));
      }
    });
    phantomChild.getChild().stdout.on('data', onPhantomData);
  }

})();