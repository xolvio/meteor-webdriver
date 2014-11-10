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

  wdio.instance = Npm.require('webdriverio');

  wdio.chai = Npm.require('chai');

  wdio.getGhostDriverClient = function (options) {
    // TODO find the phantomjs installation
    // exec phantomjs --webdriver 4444
    wdio.client = wdio.instance.remote(options).init();
    return wdio.client;
  };

})();