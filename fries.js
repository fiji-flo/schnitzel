(function () {
  "use strict";
  var restify = require('restify');
  var server = restify.createServer();
  var fs = require('fs');
  var levelFile = 'config.json';
  var groupsFile = 'groups.json';

  var groups = JSON.parse(fs.readFileSync(groupsFile
                                                , {encoding: "utf-8"}));
  var levelConfigs = JSON.parse(fs.readFileSync(levelFile
                                                , {encoding: "utf-8"}));
  function page(level, code, desc, upload, next, done) {
    return {
      level: level
      , code: code
      , desc: desc
      , upload: upload
      , next: next
      , done: done
      , status: "ok"
    };
  }

  var empty = {status: "doom"};

  function Level(config, idx) {
    this.level = idx;
    this.code = config.code;
    this.description = config.description;
    this.uploadName = config.uploadName;
    this.next = config.next;
    this.done = false;
    this.file = null;
  }

  Level.prototype.send = function () {
    return page(this.level
                , this.code
                , this.description
                , this.uploadName
                , this.done ? this.next : ""
                , this.done);
  };

  function makeLevels(configs) {
    var levels = {};
    configs.forEach(function (config, idx) {
      levels[config.code] = new Level(config, idx);
    });
    return levels;
  }

  function Session(group) {
    this.group = group;
    this.levels = makeLevels(levelConfigs);
  }

  Session.prototype.level = function (code) {
    if (code in this.levels) {
      return this.levels[code].send();
    } else {
      return empty;
    }
  };

  var sessions = {};
  groups.forEach(function (group) {
    sessions[group] = new Session(group);
  });

  function question(req, res, next) {
    res.contentType = 'json';
    var group = req.params.id;
    if (group in sessions) {
      res.send(sessions[group].level(req.body.code));
    } else {
      res.send(empty);
    }
    next();
  }

  function upload(req, res, next) {
    var group = req.params.id;
    var code = req.params.code;
    if (group in sessions) {
      var session = sessions[group];
      if (code in session.levels) {
        var level = session.levels[code];
        var num = level.level;
        if (req.files) {
          var file = req.files.file;
          console.log("gotcha");
          var newPath = 'upload/' + [group
                                     , num
                                     , (new Date()).getTime()
                                     , file.name
                                    ].join("-");
          var data = fs.readFileSync(req.files.file.path);
          fs.writeFileSync(newPath, data);
          level.uploadName = newPath;
          level.done = true;
          res.send(session.level(code));
        }
      }
    }
    next();
  }


  server.use(restify.CORS());
  server.use(restify.bodyParser());

  server.get(/\/team\/?.*/, restify.serveStatic({
    directory: './html',
    default: 'index.html'
  }));
  server.post('/q/:id', question);
  server.post('/q/:id/:code/file', upload);
  server.listen(8080);
  console.log("running ...");

})();
