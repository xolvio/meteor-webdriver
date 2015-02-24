/*jshint -W117, -W030, -W016, -W061 */
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
    colors = Npm.require('colors'),
    _screenshotCounter = 0;

  var phantomPath;

  if (process.env.PHANTOM_PATH) {
    phantomPath = process.env.PHANTOM_PATH;
  } else {
    phantomPath = phantom.path;
  }

  var defaultOptions = {
    desiredCapabilities: {browserName: 'PhantomJs'},
    port: 4444,
    logLevel: 'error',
    implicitWait: 5000
  };

  wdio.instance = Npm.require('webdriverio');

  wdio.getGhostDriver = Meteor.bindEnvironment(function (options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = _.defaults(options, defaultOptions);

    DEBUG && console.log('[xolvio:webdriver]', 'getGhostDriver called');
    _startPhantom(options.port, Meteor.bindEnvironment(function () {
      var browser = wdio.instance.remote(options);
      _polyfillPhantom(browser);
      _augmentedBrowser(browser, options);
      callback(browser);
    }));
  });


  function _polyfillPhantom(browser) {

    var polyfills = [];
    polyfills.push(Assets.getText('polyfills/url.js'));

    var _url = browser.url;
    browser.url = function () {
      if (typeof arguments[arguments.length - 1] === 'function') {
        // this is a URL get not a navigation so do nothing
        return _url.apply(this, arguments);
      }
      var retVal = _url.apply(this, arguments);
      _.each(polyfills, function (code, index) {
        _applyPolyfill(browser, code, index);
      });
      return retVal;
    };
  }

  function _applyPolyfill(browser, code, index) {
    browser.execute(function (code) {
      eval(code);
    }, code, function (err) {
      if (err) {
        throw new Error('Error applying polyfill ' + index + ', err');
      }
      DEBUG && console.log('Applied polyfill', index);
    });
  }

  function _augmentedBrowser(browser, options) {

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
      addCommand('typeInto', function (selector, value, cb) {
        this
          .click(selector)
          .keys(value)
          .call(cb);
      }).
      addCommand('takeScreenshot', function (filename, cb) {

        if (typeof filename === 'function') {
          cb = filename;
          filename = null;
        }

        if (!filename) {
          _screenshotCounter += 1;
          filename = 'screenshot' + _screenshotCounter + '.png';
        }

        if (!filename.match(/\.png$/) || !filename.match(/\.jpg$/)) {
          filename += '.png';
        }
        var ssPath = path.join(process.env.PWD, filename);
        this
          .saveScreenshot(ssPath).
          call(function () {
            console.log(colors.cyan('\nSaved screenshot to ' + ssPath));
            cb();
          });
      });

    browser.on('error', function (errorMessage) {
      browser.takeScreenshot('webdriver_error');
      console.error(JSON.parse(errorMessage.body.value.message).errorMessage);
    });

  }

  function _startPhantom(port, next) {

    var phantomChild = new sanjo3.LongRunningChildProcess('webdriver-phantom');
    if (phantomChild.isRunning()) {
      DEBUG && console.log('[xolvio:webdriver] Phantom is already running, not starting a new one');
      next();
      return;
    }

    phantomChild.spawn({
      command: phantomPath,
      args: ['--ignore-ssl-errors', 'yes', '--webdriver', '' + port]
    });

    DEBUG && console.log('[xolvio:webdriver] Starting Phantom.');
    var onPhantomData = Meteor.bindEnvironment(function (data) {
      var stdout = data.toString();
      DEBUG && console.log('[xolvio:webdriver][phantom output]', stdout);
      if (stdout.match(/running/i)) {
        console.log('[xolvio:webdriver] PhantomJS started.');
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
