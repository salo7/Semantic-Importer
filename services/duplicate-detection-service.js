var fs = require('fs');
var P = require('../models/publication.js');
var PE = require('../models/person.js');
var stDist = require('../utilities/string-distance.js');

var sqlite3 = require('sqlite3').verbose();
var dbFile = './data/vivoCache.db';
var dbExists = fs.existsSync(dbFile);

var getCachedVivoEntities = function(cb){
    var cachedPublications = [];
    var cachedPeople = [];
    var db = new sqlite3.Database(dbFile);

    db.serialize(function() {

        db.all("SELECT * FROM Persons", function(err, rows) {
            if(err)
                console.log(err);
            else{
              for(var i in rows){
                cachedPeople.push(new PE.Person(rows[i]));
              } 
              console.log('Finished retrieving persons');
            }
        });

        db.all("SELECT * FROM Publications", function(err, rows) {
            var authors = [];
            var publication = {};
            var leftToBeProcessed = rows.length;
            if(err)
                console.log(err);
            else if(!rows.length){
              cb({
                  publications: cachedPublications,
                  people: cachedPeople
              });
            }
            else {
              for (var i = rows.length - 1; i >= 0; i--) {
                publication = new P.Publication(rows[i]);
                authors = publication.authors && publication.authors.split(',');
                if (authors) {                  
                  (function(publication, authors){
                    publication.authors = [];
                    db.all("SELECT * FROM Persons WHERE id in (" + Array(authors.length+1 ).join('?').split('').join(',')  + ")", authors, function (err, persons) {
                      if(err)
                          console.log(err);
                      else if (persons) {
                        for (var k = persons.length - 1; k >= 0; k--) {
                          publication.authors.push(persons[k].name.trim()); 
                        };
                        publication.authors;
                        cachedPublications.push(publication);
                        --leftToBeProcessed;

                        if (leftToBeProcessed === 0) {
                          cb({
                              publications: cachedPublications,
                              people: cachedPeople
                          });
                        };
                      };
                    });
                    })(publication, authors);
                }
                else{
                  cachedPublications.push(publication); 
                  --leftToBeProcessed;
                  if (leftToBeProcessed === 0) {
                    cb({
                        publications: cachedPublications,
                        people: cachedPeople
                    });
                  };
                }
                console.log('Ended author loop');
              } 
              console.log('Finished retrieving publications');
            }
        });
    });
};


var detectDuplicates = function (importPublications, cb) {
  var possibleDuplPublications = [];  
  var vivoPublications = [];

  var possibleDuplPeople = [];  
  var possibleDuplJournals = [];  
  var possibleDuplConferences = [];  
  var threshold = 5;
  var totalMatches = 0;
  var i = 0, j = 0, score = 0;

  var executionTimes = [];
// Publications
// for each possible duplicate element regardless of type, add as property to relevent publication object. e.g.  importPublications[i].possibleDuplPublications etc
    getCachedVivoEntities(function(cachedEntities){
      var isIdentical, isChangedDuplicate, isPossibleDuplicate;

        cachedEntities.publications = cachedEntities.publications;
          console.time("levenshtein");

        for( i in importPublications){
          // var execTime = process.hrtime();
          var importedPublication = importPublications[i];
          isIdentical = null, isChangedDuplicate = null, isPossibleDuplicate = null;
          for (j = cachedEntities.publications.length - 1; j >= 0; j--) {
              totalMatches++;
              var cachedPublication = cachedEntities.publications[j];
                //compare publications
                // console.log('loop ', i, j)
                // score = stDist.getLevenshteinDistance(importedPublication.title.toLowerCase(), cachedPublication.title.toLowerCase());
                score = stDist.getLevenshteinDistance(importedPublication.title, cachedPublication.title);
                
                
                // if (score < 10) {
                //      importedPublication.possibleDuplPublication = cachedPublication;
                // };



                if (importedPublication.extSourceID === cachedPublication.extSourceID) {
                  if (score > 0) {
                    isChangedDuplicate = cachedPublication;
                    break;
                  }
                  else {
                    isIdentical = cachedPublication;
                    break;
                  }
                }
                else {
                  if (score < threshold) {
                    isPossibleDuplicate = cachedPublication;
                    break;
                  }
                }

                //authors
                // for( ia in importedPublication.authors){
                //   for( ca in cachedPublication.authors){
                //     var importAuthor = importedPublication.authors[ia];
                //     var cachedAuthor = cachedPublication.authors[ca];

                //     score = stDist.getLevenshteinDistance(importAuthor.name.toLowerCase(), cachedAuthor.name.toLowerCase());

                //     console.log(importAuthor.name);
                //     console.log(cachedAuthor.name);
                //     console.log(score);
                //     console.log('-----------------------------------------------------');
                //   }
                // }

            }

            if (isChangedDuplicate) {
                importedPublication.changedDuplicate = isChangedDuplicate;
            }
            else if (isIdentical) {
              importedPublication.identical = isIdentical;
            }
            else if (isPossibleDuplicate) {
                importedPublication.possibleDuplicate = isPossibleDuplicate;
              }
            else {
              importedPublication.new = true;
            }    
          // var diffTime = process.hrtime(execTime);
          // console.log('benchmark took %d nanoseconds', diffTime[0] * 1e6 + diffTime[1]);
          
        }
          console.timeEnd("levenshtein");
          console.log('Total matches:', totalMatches)
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