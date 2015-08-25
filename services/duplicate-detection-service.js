var fs = require('fs');
var P = require('../models/publication.js');
var stDist = require('../utilities/string-distance.js');

var sqlite3 = require('sqlite3').verbose();
var dbFile = './data/vivoCache.db';
var dbExists = fs.existsSync(dbFile);

var getCachedVivoPublications = function(cb){
    var cachedPublications = [];
    var db = new sqlite3.Database(dbFile);

    db.each("SELECT * FROM Publications", function(err, row) {
        if(err)
            console.log(err);
        else
            cachedPublications.push(new P.Publication(row));
    }, function(err, rows) {
        cb(cachedPublications);
    });

    db.close();
};


var detectDuplicates = function (importPublications, cb) {
  var possibleDuplPublications = [];  
  var vivoPublications = [];

  var possibleDuplPeople = [];  
  var possibleDuplJournals = [];  
  var possibleDuplConferences = [];  

  var i = 0, j = 0, score = 0;

// Publications
// 1. get all publications 
    getCachedVivoPublications(function(vivoPublications){
        console.time("levenshtein");
        for( i in importPublications){
           for( j in vivoPublications){
                score = stDist.getLevenshteinDistance(importPublications[i].title.toLowerCase(), vivoPublications[j].title.toLowerCase());
                // for each possible duplicate element regardless of type, add as property to relevent publication object. e.g.  importPublications[i].possibleDuplPublications etc
                
                console.log(importPublications[i].title);
                console.log(vivoPublications[j].title);
                console.log(score);
                console.log('-----------------------------------------------------');
                
                if (score < 10) {
                     importPublications[i].possibleDuplPublication = vivoPublications[j];
                };
            } 
        }
        console.timeEnd("levenshtein");
        cb(importPublications);
    });


  // return {
  //   publications: possibleDuplPublications,
  //   people: possibleDuplPeople,
  //   journals: possibleDuplJournals,
  //   conferences: possibleDuplConferences
  // }
};

exports.DetectDuplicates = detectDuplicates;