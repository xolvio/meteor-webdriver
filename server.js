/*jshint -W117, -W030, -W016 */
/* global
 DEBUG:true
 */

wdio = {};

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {
  'use strict';

  if (process.env.NODE_ENV !== 'development' || process.env.VELOCITY === '0' || process.env.IS_MIRROR) {
    return;
  }

  var phantom = Npm.require('phantomjs');
  var childProcess = Npm.require('child_process');

  wdio.instance = Npm.require('webdriverio');

  wdio.getBrowser = function (options, callback) {
    // TODO automatically start ghost driver if it hasn't been started
    //_startPhantom(4444, {}, function () {
    callback(wdio.instance.remote(options));
    //});
  };

  function _startPhantom (port, opts, next) {
    var phantomOpts = opts.phantomFlags || [];
    phantomOpts.push('--webdriver', port);
    if (opts.ignoreSslErrors) {
      phantomOpts.push('--ignore-ssl-errors', 'yes');
    }
    var phantomProc = childProcess.execFile(phantom.path, phantomOpts);
    var stopPhantomProc = function () {
      phantomProc.kill();
    };
    // stop child phantomjs process when interrupting master process
    process.on('SIGINT', stopPhantomProc);

    phantomProc.on('exit', function () {
      process.removeListener('SIGINT', stopPhantomProc);
    });
    phantomProc.stdout.setEncoding('utf8');
    var onPhantomData = function (data) {
      if (data.match(/running/i)) {
        console.log('PhantomJS started.');
        phantomProc.stdout.removeListener('data', onPhantomData);
        next(null, phantomProc);
      }
      else if (data.match(/error/i)) {
        console.error('Error starting PhantomJS');
        next(new Error(data));
      }
    };
    phantomProc.stdout.on('data', onPhantomData);
  }

})();