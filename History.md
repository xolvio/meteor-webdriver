#0.5.2

* Increased phantom startup timeout

#0.5.1

* Fixed chrome driver npm path issue

#0.5.0

* Added ChromeDriver support

#0.4.2

* Fixed ChromeDriver issue (early commit!)

#0.4.1

* Added DEBUG_WEBDRIVER for only showing webdriver debug logs
* Fixed false error reporting from phantom process
* Made phantom poly-filling synchronous
* Added debugging messages

#0.4.0

* Compromised speed for stability in this release
* Now uses the same phantomjs as the installed meteor tools (no npm download!)
* Reworked phantomjs spwaning so that it kills all phantomjs processes prior to starting (kill -9 so beware!)
* Rewrote the screen grabbing on-error to maintain the event chain (plays nicer with cucumber)
* Reduced (eliminated?) restarts when a webdriver error is encountered

#0.3.1

* Improved error visibility and log-level

#0.3.0

* Phantom polyfill capability
* Added helper commands:
    waitForPresent - Ensures elements exist and are visible
    waitForAndClick - Runs a waitForPresent then clicks an element
    takeScreenshot - adds some smarts over the standard saveScreenshot command
    typeInto - Clicks an element then types keys
* Automatically takes a screenshot when webdriver encounters an error
* Bumped webdriver version 2.4.5
* Bumped phantomjs version to 1.9.15

#0.2.1 / 0.2.2

* Add a PHANTOM_PATH environment variable to help with CI environments.

#0.2.0

* WebdriverIO can now run inside a mirror

#0.1.8

* Hotfix: Path issue

#0.1.7

* Clash with Jasmine Spawner

#0.1.6

* Fixed issue in child process

#0.1.5

* Using latest LongRunningChildProcess from Sanjo

#0.1.4

* Update to the spawn approach

#0.1.3

* Fixed Phantom spawning and timing issues

#0.1.1 - 0.1.2

* Void (connection issues messed up build on package server)

#0.1.0

* Actually using semvar now
* Replaced process starting with practicalmeteor ChildProcessFactory

#0.0.4
Fixed phantom message

#0.0.3
No longer depends on Velocity

#0.0.2
Improved log messaging

#0.0.1
Initial release
