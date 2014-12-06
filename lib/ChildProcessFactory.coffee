fs = Npm.require 'fs'
path = Npm.require 'path'
spawn = Npm.require('child_process').spawn
assert = Npm.require('assert')

@practical ?= {}

class practical.ChildProcessFactory

  instance = null

  @get: ->
    instance ?= new practical.ChildProcessFactory()

  exiting: false

  child: null

  command: null

  dead: false

  appPath: null

  pidDirPath: null

  logDirPath: null

  @_spawn = Npm.require('child_process').spawn


  constructor: ->
    log.debug "ChildProcessFactory.constructor()"
    @getMeteorAppPath()
    @meteorLocalDirPath = path.resolve(@appPath, '.meteor/local')
    assert(fs.existsSync(@meteorLocalDirPath), 'Cannot find the .meteor/local directory under the app root')

    pidDirPath = path.resolve(@meteorLocalDirPath, 'run')
    fs.mkdirSync(pidDirPath) if not fs.existsSync(pidDirPath)
    @pidDirPath = pidDirPath

    logDirPath = path.resolve(@meteorLocalDirPath, 'log')
    fs.mkdirSync(logDirPath) if not fs.existsSync(logDirPath)
    @logDirPath = logDirPath
    log.debug "@logDirPath=#{@logDirPath}"

    process.once 'SIGINT', =>
      log.debug "ChildProcessFactory: process.on 'SIGINT'"
      @exiting = true
      log.info "meteor is exiting, killing #{@taskName}"
      @kill('SIGINT')
      process.kill(process.pid, 'SIGINT')


  getMeteorAppPath: ->
    log.debug 'ChildProcessFactory.getMeteorAppPath()', @appPath
    return @appPath if @appPath is not null
    if process.env.METEOR_APP_PATH?
      assert(fs.existsSync(path.resolve(process.env.METEOR_APP_PATH, '.meteor/local')), 'METEOR_APP_PATH is not a valid meteor app directory')
      return @appPath = process.env.METEOR_APP_PATH
    dir = process.cwd()
    appPathEnd = dir.lastIndexOf('/.meteor/')
    if appPathEnd is -1
      throw new Error("Cannot find the meteor app root directory in #{process.cwd()}")
    @appPath = dir.slice(0, appPathEnd)
    log.debug "appPath='#{@appPath}'"
    return @appPath


  isRunning: (taskName)->
    log.debug 'ChildProcessFactory.isRunning()', taskName
    check(taskName, String)

    assert(fs.existsSync(@pidDirPath), ".meteor/local/run directory doesn't exist")

    @pidFile = "#{@pidDirPath}/#{taskName}.pid"

    log.debug "@pidFile=#{@pidFile}"

    return false if not fs.existsSync(@pidFile)

    pid = +fs.readFileSync(@pidFile)
    log.debug "Found pid file #{@pidFile} with pid #{pid}, checking if #{taskName} is running."
    try
    # Check for the existence of the process without killing it, by sending signal 0.
      process.kill(pid, 0)
      # process is alive, otherwise an exception would have been thrown, so we need to exit.
      log.debug "Process with pid #{pid} is already running, will not launch #{taskName} again."
      @pid = pid
      return true
    catch err
      log.trace err
      log.debug "pid file #{@pidFile} exists, but process is dead, will launch #{taskName} again."
      return false


  spawnSingleton: (options)->
    log.debug "ChildProcessFactory.spawn()", arguments
    check options, Match.ObjectIncluding({
        taskName: String
        killSignals: Match.Optional([String])
        logToConsole: Match.Optional(Boolean)
        command: String
        args: [String]
        options: Match.Optional(Match.ObjectIncluding({
          cwd: Match.Optional(String)
          env: Match.Optional(Object)
        }))
      }
    )

    assert.equal(@child, null, "ChildProcess is already running")

    @taskName = options.taskName

    @command = path.basename options.command

    if @isRunning(@taskName)
      return false

    spawnOptions = @getSpawnOptions(@taskName)

    log.debug("spawning #{@command}")

    @child = practical.ChildProcessFactory._spawn(options.command, options.args, spawnOptions)

    log.debug "Saving #{@taskName} pid #{@child.pid} to #{@pidFile}"
    fs.writeFileSync(@pidFile, "#{@child.pid}")

    @child.on "exit", (code, signal)=>
      log.debug "ChildProcessFactory: child_process.on 'exit': @command=#{@command} @dead=#{@dead} code=#{code} signal=#{signal}"
      @dead = true

    return @child


  getSpawnOptions: (taskName)->
    log.debug 'ChildProcessFactory.getSpawnOptions()'
    check(taskName, String)

    assert(fs.existsSync(@logDirPath), ".meteor/local/log directory doesn't exist")

    #@logFile = "#{@logDirPath}/#{taskName}.log"
    #@fout = fs.openSync(@logFile, 'w')
    #@ferr = fs.openSync(@logFile, 'w')

    options =
      cwd: @appPath,
      env: process.env,
      detached: true
      #, stdio: [ 'ignore', @fout, @fout ]


  kill: (signal = "SIGPIPE")->
    log.debug "ChildProcessFactory.kill() signal=#{signal} @command=#{@command} @dead=#{@dead}"
    return if @dead
    try
    # Providing a negative pid will kill the entire process group,
    # i.e. the process and all it's children
    # See man kill for more info
    #process.kill(-@child.pid, signal)
      if @child?
        @child.kill(signal)
      else if @pid?
        process.kill(@pid, signal)
      @dead = true
    catch err
      log.warn "Error: While killing #{@command} with pid #{@child.pid}:\n", err


if ! process.env.TESTING
  Meteor.startup =>
    practical.ChildProcessFactory.get()