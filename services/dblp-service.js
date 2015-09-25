var Q = require('q');
var request = Q.denodeify(require('request'));
var parseString = require('xml2js').parseString;
var winston = require('winston');
var P = require('../models/publication.js');
var fs = require('fs');

var sqlite3 = require('sqlite3').verbose();
var dbFile = './data/vivoCache.db';
var dbExists = fs.existsSync(dbFile);

exports.searchAuthors = function(isExtensiveSearch, authorName, cb){
  if(!isExtensiveSearch){
    authorName = authorName.split(' ').join('$') + '$';
  }
  var response = request({
    uri: 'http://dblp.uni-trier.de/search/author?xauthor=' + authorName,
    method: 'GET'
  });
  response.then(function (resp) {
    var responseObject, respAuthor, authorObj;
    var returnAuthors = [];
    resp = resp[0];
    if (resp.statusCode >= 300) {
      throw new Error('Server responded with status code ' + resp.statusCode)
    } else {    
      parseString(resp.body, function (err, result) {
        responseObject = result;
      });
      resultsNum = responseObject.authors.author.length;
      for(var i in responseObject.authors.author){
        respAuthor = responseObject.authors.author[i];
        authorObj = {
          authorName: respAuthor._,
          urlpt: respAuthor['$'].urlpt
        };
        returnAuthors.push(authorObj);
      }
      cb(returnAuthors);
    }
  });
};


function parsePublicationXML(xml, dblpkey, cb){
  var responseObjectDetails;  
  parseString(xml, function (err, resultDetails) {
    responseObjectDetails = resultDetails;
    respPub = {};
    
    var key = Object.keys( responseObjectDetails.dblp)[0];
    var details = responseObjectDetails.dblp[key][0];
    
    respPub.extSourceID = dblpkey;
    respPub.type = key;
    respPub.key = details['$'].key;
    respPub.mdate = details['$'].mdate;
    respPub.authors = details.author;
    respPub.editors = details.editor;
    respPub.title = details.title && details.title[0];
    respPub.pages = details.pages && details.pages[0];
    respPub.year = details.year && details.year[0];
    respPub.booktitle = details.booktitle  &&  details.booktitle[0];
    respPub.url = details.url && details.url[0];
    respPub.ee = details.ee && details.ee[0];
    // returnPublications.push(new P.Publication(respPub));
    cb(respPub);              
  });
}

function cacheResponse(url, xml, db){

  db.run('INSERT OR REPLACE INTO DblpCache (url, xml) VALUES(?,?)', [url, xml], function(error){
      if(error){
          console.log(error);
          db.close();
      }
  });   

}

exports.searchPublications = function (dblpUserID, authorName, cb){
  winston.log('debug','Into searchPublications');
  var db = new sqlite3.Database(dbFile);
  var returnPublications = [];
  var authorUrl = 'http://dblp.uni-trier.de/pers/xk/' + dblpUserID;
  
  db.all("SELECT * FROM `DblpCache` where url=?", [authorUrl], function(err, rows) {
    var authorUrl = 'http://dblp.uni-trier.de/pers/xk/' + dblpUserID;
    winston.log('debug','Into select from cache results where url: ' + authorUrl);

    var pub;
      if(err)
          console.log(err);
      else if(rows && rows.length){     
        pub = rows[0];             
        returnPublications[pub.key] = pub;
      }
      else {  
        winston.log('debug','Into request publications for author: ' + dblpUserID);
        var response = request({
          uri: authorUrl,
          method: 'GET'
        });  
        
        response.then(function (resp) {
          var responseObject;
          var returnPublications = {};//[];
          var completeResponse = '';
          var respPub;
          var authorName;
          var leftToBeProcessed;
          resp = resp[0];
          if (resp.statusCode >= 300) {
            throw new Error('Server responded with status code ' + resp.statusCode)
          } else {    
            winston.log('debug','DBLP responded');
            parseString(resp.body, function (err, result) {
              winston.log('debug','Parsing DBLP response');
              responseObject = result;        
              authorName=responseObject.dblpperson['$'].name;
              
              var length = responseObject.dblpperson.dblpkey.length;
              leftToBeProcessed = responseObject.dblpperson.dblpkey.length;
              var lastDblpKey =  responseObject.dblpperson.dblpkey[length-1];
              // var lastDblpKey =  responseObject.dblpperson.dblpkey[4];
                      
              
              console.time("dblpFetch");
              for(var j=1; j < responseObject.dblpperson.dblpkey.length; j++){
              // for(var j=1; j < 5; j++){
                  var dblpkey = responseObject.dblpperson.dblpkey[j];            
                  var publicationURL = 'http://dblp.uni-trier.de/rec/xml/' + dblpkey;

                  (function(dblpkey){
                    db.all("SELECT * FROM `DblpCache` where url=?", [publicationURL], function(err, rows) {
                      var publicationURL = 'http://dblp.uni-trier.de/rec/xml/' + dblpkey;
                      winston.log('debug','Into select from cache results where url: ' + publicationURL);
                      var pub;
                        if(err)
                            console.log(err);
                        else if(rows && rows.length){     
                          pub = rows[0];             
                          parsePublicationXML(pub.xml, dblpkey, function (publication) {
                            winston.log('debug','Parsing dblp response');    
                            returnPublications[publication.key] = new P.Publication(publication);
                            if(--leftToBeProcessed <= 1){
                              console.timeEnd("dblpFetch");
                              cb(returnPublications);        
                            }   
                          });
                        }
                        else {
                          
                          setTimeout(function(){
                            (function(dblpkey){
                            var response = request({
                              uri: 'http://dblp.uni-trier.de/rec/xml/' + dblpkey,
                              method: 'GET'
                            });  
                          
                            response.then(function (resp) {
                              resp = resp[0];
                              if (resp.statusCode >= 300) {
                                throw new Error('Server responded with status code ' + resp.statusCode)
                              } else {  
                                  winston.log('debug','DBLP responded');                                
                                  // cacheResponse('http://dblp.uni-trier.de/rec/xml/' + dblpkey, resp.body, db);
                                  db.run('INSERT OR REPLACE INTO DblpCache (url, xml) VALUES(?,?)', ['http://dblp.uni-trier.de/rec/xml/' + dblpkey, resp.body], function(error){
                                    if(error){
                                        console.log(error);
                                        db.close();
                                    }
                                    winston.log('debug','Inserted into DblpCache url with key: ' + dblpkey);    
                                    parsePublicationXML(resp.body, dblpkey, function (pub) {
                                      winston.log('debug','Parsing dblp response');    
                                      returnPublications[pub.key] = new P.Publication(pub);
                                      if(--leftToBeProcessed <= 1){
                                        cb(returnPublications);        
                                      }   
                                    });
                                  });   
                              }
                            });
                          })(dblpkey)}, 0);  
                        }
                  });
                  })(dblpkey);
              }    
            });
          }
        });
    };
  });
}