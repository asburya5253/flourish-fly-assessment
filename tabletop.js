/*!
 * Tabletop.js - v1.6.0 - 2014-09-22
 * https://github.com/jsoma/tabletop
 */
(function(root, factory) {
    if (typeof exports === 'object') {
      module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
      define(factory);
    } else {
      root.Tabletop = factory();
    }
  }(this, function() {
    var Tabletop = {};
    Tabletop.init = function(opts) {
      opts = opts || {};
      var key = opts.key;
      var callback = opts.callback || function() {};
      var wanted = opts.wanted || [];
      var simpleSheet = opts.simpleSheet || false;
      var parseNumbers = opts.parseNumbers !== false;
      var postProcess = opts.postProcess || function(data) { return data; };
      var error = opts.error || function(err) { console.error(err); };
  
      if (!key) {
        error("You need to pass a spreadsheet key!");
        return;
      }
  
      var sheets = {};
      var sheetsArray = [];
      var fetchSheet = function(sheet) {
        var url = sheet.url + "?alt=json";
        return fetch(url)
          .then(function(response) { return response.json(); })
          .then(function(data) {
            sheet.data = data.feed.entry || [];
            sheet.elements = data.feed.entry || [];
            return sheet;
          });
      };
  
      var fetchSheets = function() {
        return fetch("https://spreadsheets.google.com/feeds/worksheets/" + key + "/public/basic?alt=json")
          .then(function(response) { return response.json(); })
          .then(function(data) {
            sheetsArray = data.feed.entry.map(function(sheet) {
              var id = sheet.id.$t.match(/([^\/]+)$/)[1];
              return {
                name: sheet.title.$t,
                id: id,
                url: sheet.content.src
              };
            });
  
            if (wanted.length) {
              sheetsArray = sheetsArray.filter(function(sheet) {
                return wanted.indexOf(sheet.name) !== -1;
              });
            }
  
            var fetches = sheetsArray.map(fetchSheet);
  
            return Promise.all(fetches).then(function(results) {
              results.forEach(function(sheet) {
                sheets[sheet.name] = sheet;
              });
              return sheets;
            });
          });
      };
  
      fetchSheets().then(function(data) {
        if (simpleSheet && sheetsArray.length === 1) {
          var simpleData = sheetsArray[0].data.map(function(entry) {
            var obj = {};
            for (var key in entry) {
              if (key.indexOf('gsx$') === 0) {
                obj[key.substring(4)] = entry[key].$t;
              }
            }
            return obj;
          });
          callback(simpleData, sheets);
        } else {
          callback(sheetsArray.length === 1 ? sheetsArray[0].data : sheets, sheets);
        }
      }).catch(error);
  
      return Tabletop;
    };
  
    return Tabletop;
  }));
  