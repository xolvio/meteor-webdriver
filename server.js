/*jshint -W117, -W030, -W016, -W061 */
/* global
 DEBUG:true,
 */

wdio = {};

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {
  'use strict';

  if (process.env.NODE_ENV !== 'development' || process.env.VELOCITY === '0') {
    return;
  }

  var path = Npm.require('path'),
    spawn = Npm.require('child_process').spawn,
    _screenshotCounter = 0;

  var _phantomPath;

  if (process.env.PHANTOM_PATH) {
    _phantomPath = process.env.PHANTOM_PATH;
  } else {
    _phantomPath = path.join(
      process.env.OLDPWD, 'dev_bundle', 'lib', 'node_modules',
      'phantomjs', 'lib', 'phantom', 'bin', 'phantomjs');
  }

  var defaultOptions = {
    desiredCapabilities: {browserName: 'PhantomJs'},
    port: 4444,
    logLevel: 'error',
    implicitWait: 5000
  };

  wdio.instance = Npm.require('webdriverio');

  wdio.startPhantom = Meteor.bindEnvironment(function (options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    wdio.killAllPhantomProcesses(function () {
      _startPhantom(options.port, callback);
    });

  });

  wdio.getGhostDriverRemote = Meteor.bindEnvironment(function (options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = _.defaults(options, defaultOptions);

    DEBUG && console.log('[xolvio:webdriver]', 'getGhostDriver called');
    var browser = wdio.instance.remote(options);
    _polyfillPhantom(browser);
    _augmentedBrowser(browser, options);
    callback(browser);
  });

  wdio.getGhostDriver = Meteor.bindEnvironment(function (options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    wdio.startPhantom(options, function () {
      wdio.getGhostDriverRemote(options, callback);
    });

  });

  wdio.killAllPhantomProcesses = function (callback) {
    spawn('pkill', ['-9', 'phantomjs']).on('close', Meteor.bindEnvironment(callback));
  };

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
        console.error('Error applying polyfill ' + index + ', err');
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
      addCommand('takeScreenshot', function (filename, silent, cb) {

        if (typeof filename === 'function') {
          cb = filename;
          filename = null;
        }

        if (typeof silent === 'function') {
          cb = silent;
          silent = false;
        }

        if (!filename) {
          filename = 'screenshot' + _getNextScreenshotNumber() + '.png';
        }

        if (!filename.match(/\.png$/) && !filename.match(/\.jpg$/)) {
          filename += '.png';
        }
        var ssPath = path.join(process.env.PWD, filename);
        this
          .saveScreenshot(ssPath).
          call(function () {
            if (!silent) {
              console.log('\nSaved screenshot to ' + ssPath);
            }
            cb();
          });
      });


    var listener = function (e) {

      if (e.body) {
        // only take screenshot if error has a body (means it's from a page)
        var screenshotName = 'webdriver_error_' + _getNextScreenshotNumber() + '.png';
        browser.takeScreenshot(screenshotName, true);
        console.error('Captured error screenshot at ' +
        path.join(process.env.PWD, screenshotName));
      }

      this.removeListener('error', listener);
      this.emit('error', e);
    };
    browser.on('error', listener);

  }

  function _getNextScreenshotNumber() {
    return '' + _screenshotCounter++;
  }

  function _startPhantom(port, next) {

    var phantomChild = spawn(_phantomPath, ['--ignore-ssl-errors', 'yes', '--webdriver', '' + port]);

    var phantomStartupTimeout = 5;
    var phantomStartupTimer = setTimeout(function () {
      console.error('Phantom failed to start in', phantomStartupTimeout, ' seconds', _phantomPath);
      phantomChild.kill('SIGTERM');
      throw new Error('Phantom failed to start');
    }, phantomStartupTimeout * 1000);

    DEBUG && console.log('[xolvio:webdriver] Starting Phantom.');
    var onPhantomData = Meteor.bindEnvironment(function (data) {
      var stdout = data.toString();
      DEBUG && console.log('[xolvio:webdriver][phantom output]', stdout);
      if (stdout.match(/running/i)) {
        clearTimeout(phantomStartupTimer);
        DEBUG && console.log('[xolvio:webdriver] PhantomJS started.');
        next();
      }
      else if (stdout.match(/Error/)) {
        console.error('[xolvio:webdriver] Error starting PhantomJS');
        next();
      }
    });
    phantomChild.stdout.on('data', onPhantomData);

    phantomChild.on('error', function (err) {
      console.error('Error executing phantom at', _phantomPath);
      console.error(err.stack);
    });

    process.on('exit', function () {
      phantomChild.kill('SIGKILL');
    });

  }

})();
