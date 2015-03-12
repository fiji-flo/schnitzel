window.onload = function () {
  "use strict";

  var group = window.location.hash.slice(1);
  var BASEURL = "..";

  function eid(id) {
    return document.getElementById(id);
  }

  function ajax(url, data, cb) {
    var xhr = new window.XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = function () { cb(JSON.parse(this.responseText)); };
    xhr.send(JSON.stringify(data));
  }

  function upload(postUrl, fieldName, file, cb) {
    var formData = new FormData();
    formData.append(fieldName, file);

    var req = new XMLHttpRequest();
    req.open("POST", postUrl);
    req.onload = function() { cb(JSON.parse(this.responseText)); };
    req.send(formData);
  }

  function html(e, t) {
    e.innerHTML = t;
    return e;
  }

  function activate (e) {
    var contents = document.getElementsByClassName("content");
    for (var i = 0; i < contents.length; ++i) {
      contents[i].style.display = "none";
    }
    e.style.display = "flex";
  }

  function ask(code) {
    ajax(BASEURL + "/q/" + group, code, function (q) {
      if (q.status === "ok") {
        if (q.done) {
          challangePageDone.set();
          challangePageDone.text(q);
        } else {
          challangePage.set();
          challangePage.text(q);
        }
      } else {
        queryPage.set();
      }
    });
  }

  function solve(file, code) {
    var url = [BASEURL, "q", group, code, "file"].join('/');
    upload(url, "file", file, function (q) {
      challangePageDone.set();
      challangePageDone.text(q);
    });
  }

  var queryPage = (function () {
    var div = eid("query");
    var input = eid("qcode");
    var button = eid("qbutton");
    button.onclick = function () { ask({code: input.value}); };
    return {
      set: function () { activate(div); }
    };
  })();

  var challangePage = (function () {
    var div = eid("challange");
    var description = eid("cdesc");
    var file = eid("cfile");
    var button = eid("cbutton");
    var back = eid("cback");
    back.onclick = function () {
      queryPage.set();
    };

    function init (level) {
      html(description, level.desc);
      var code = level.code;
      button.onclick = function () {
        solve(file.files[0], code);
      }
    }
    return {
      text:  function (q) { init(q); }
      , set: function () { activate(div); }
    };
  })();

  var challangePageDone = (function () {
    var div = eid("challangeDone");
    var description = eid("ddesc");
    var next = eid("dnext");
    var back = eid("dback");
    back.onclick = function () {
      queryPage.set();
    };

    function init (level) {
      html(description, level.desc);
      html(next, level.next);
    }
    return {
      text:  function (q) { init(q); }
      , set: function () { activate(div); }
    };
  })();

  queryPage.set();
};
