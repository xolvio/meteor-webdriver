/*jshint -W117, -W030, -W016 */
/* global
 DEBUG:true
 */

wdio = {
  singletons: new Meteor.Collection('wdioSingletons')
};


DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {
  'use strict';

  if (process.env.NODE_ENV !== 'development' || process.env.VELOCITY === '0' || process.env.IS_MIRROR) {
    return;
  }

  var phantom = Npm.require('phantomjs'),
      childProcess = Npm.require('child_process');

  wdio.instance = Npm.require('webdriverio');

  wdio.getGhostDriver = function (options, callback) {
    _startPhantom(options.port, {}, function () {
      callback(wdio.instance.remote(options));
    });
  };

  function _startPhantom (port, opts, next) {
    if (_phantomStarted()) {
      next();
      return;
    }
    var phantomOpts = opts.phantomFlags || [];
    phantomOpts.push('--webdriver', port);
    if (opts.ignoreSslErrors) {
      phantomOpts.push('--ignore-ssl-errors', 'yes');
    }
    var phantomProc = childProcess.execFile(phantom.path, phantomOpts);
    var stopPhantomProc = function () {
      phantomProc.kill();
    };
    process.on('SIGINT', stopPhantomProc);

    phantomProc.on('exit', function () {
      process.removeListener('SIGINT', stopPhantomProc);
    });
    phantomProc.stdout.setEncoding('utf8');
    var onPhantomData = Meteor.bindEnvironment(function (data) {
      if (data.match(/running/i)) {
        console.log('[webdriver] PhantomJS started.');
        wdio.singletons.upsert({_id: 'phantomPid'}, {_id: 'phantomPid', value: phantomProc.pid});
        phantomProc.stdout.removeListener('data', onPhantomData);
        next(null, phantomProc);
      }
      else if (data.match(/error/i)) {
        console.error('[webdriver] Error starting PhantomJS');
        next(new Error(data));
      }
    });
    phantomProc.stdout.on('data', onPhantomData);
  }

  function _phantomStarted () {
    var pid = wdio.singletons.findOne('phantomPid');
    if (!pid) {
      return false;
    }
    DEBUG && console.log('[webdriver] Checking if Phantom is running with pid', pid);
    try {
      process.kill(pid.value, 0);
      DEBUG && console.log('[webdriver] PhantomJS is already running');
      return true;
    } catch (e) {
      DEBUG && console.log('[webdriver] PhantomJS is not running');
      return false;
    }
  }

})();