meteor-webdriver
================

*THIS PACKAGE IS NO LONGER MAINTAINED*
Use at your own risk :) You might consider using meteor-cucumber instead.
We plan to put end-to-end testing inside Jasmine in the near future, you can speed this up by sponsoring this release. [See this page for details](http://xolv.io/services/velocity-premium-support/)

A [WebdriverIO](http://webdriver.io) wrapper for UI testing using any testing framework.

1. Starts PhantomJS in webdriver mode
2. Provides you with a browser you can automate using the industry-standard Selenium Webdriver

# Get the Book
To learn more about testing with Meteor, consider purchasing our book [The Meteor Testing Manual](http://www.meteortesting.com/?utm_source=webdriver&utm_medium=banner&utm_campaign=webdriver).

[![Meteor Testing Manual](http://www.meteortesting.com/img/tmtm.gif)](http://www.meteortesting.com/?utm_source=webdriver&utm_medium=banner&utm_campaign=webdriver)

Your support helps us continue our work on Velocity and related frameworks.

## Installation

```sh
meteor add xolvio:webdriver
```

## Usage

The following examples are for Mocha. You can also [use Webdriver.io with Jasmine](https://github.com/Sanjo/meteor-jasmine/wiki/End-to-End-Tests).

```javascript

describe('Browser testing', function(done) {

  var _browser;

  before(function (done) {
    wdio.getGhostDriver(function(browser) {
      _browser = browser;
      done();
    });
  })

  it('should have the correct title', function (done) {
    _browser.
      init().
      url('http://www.google.com').
      title(function(err, res) {
          console.log('Title was: ' + res.value);
      }).
      end().
      call(done);
  });

});

```
You can also use ChromeDriver like this (no need to download anything!):

```javascript

describe('Browser testing', function (done) {

  var _browser;

  before(function(done) {
    wdio.getChromeDriver(function (browser) {
      _browser = browser;
      done();
    });
  })

  // see above

});

```


For more examples and usage, see the [webdriver.io website](http://webdriver.io).

## Phantom.js and CI

If this package is included for testing your Meteor app, it should work fine out of the box. You may encounter issues when you try
to run on the CI server, as it doesn't seem to detect the right phantom.js binary to download. You can instead just `npm install -g phantomjs`
and then set `PHANTOM_PATH` as an environment variable when you run your Meteor CI test build.

## Package Roadmap

- [x] [WebdriverIO](http://webdriver.io)
- [x] Use PhantomJS in GhostDriver mode
- [x] Automatically Download [ChromeDriver](https://code.google.com/p/selenium/wiki/ChromeDriver)
- [x] Automatically Download [Selenium Server](http://www.seleniumhq.org/download/)
- [ ] Reuse the selenium webdriver session between tests so the browser does not flicker on and off
- [ ] Support multiple window testing
- [ ] Specify the browser matrix to run in development
- [ ] Specify the browser matrix to run in continuous integration mode
- [ ] SauceLabs & BrowserStack support
