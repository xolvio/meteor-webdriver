/*jshint -W117, -W030, -W016 */
/* global
 DEBUG:true
 */

log = loglevel.createPackageLogger('[xolvio:webdriver]', process.env.WEBDRIVER_LOG_LEVEL || 'info');

wdio = {};

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {
  'use strict';

  if (process.env.NODE_ENV !== 'development' || process.env.VELOCITY === '0' || process.env.IS_MIRROR) {
    return;
  }

  var phantom = Npm.require('phantomjs');

  wdio.instance = Npm.require('webdriverio');

  wdio.getGhostDriver = function (options, callback) {
    _startPhantom(options.port, function () {
      callback(wdio.instance.remote(options));
    });
  };


  function _startPhantom (port, next) {

    var cpf = practical.ChildProcessFactory.get();
    var phantomSpawnOptions = {
      taskName: 'phantom',
      command: phantom.path,
      args: ['--ignore-ssl-errors', 'yes', '--webdriver', '' + port]
    };

    if (cpf.isRunning(phantomSpawnOptions.taskName)) {
      next();
      return;
    }

    var phantomChild = cpf.spawnSingleton(phantomSpawnOptions);
    var onPhantomData = Meteor.bindEnvironment(function (data) {
      var stdout = data.toString();
      if (stdout.match(/running/i)) {
        console.log('[xolvio:webdriver] PhantomJS started.');
        phantomChild.stdout.removeListener('data', onPhantomData);
        next();
      }
      else if (stdout.match(/error/i)) {
        console.error('[xolvio:webdriver] Error starting PhantomJS');
        next(new Error(data));
      }
    });
    phantomChild.stdout.on('data', onPhantomData);
  }

})();