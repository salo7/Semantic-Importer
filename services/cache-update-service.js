var fs = require('fs');
var Q = require('q');
var request = Q.denodeify(require('request'));
var P = require('../models/publication.js');

var sqlite3 = require('sqlite3').verbose();
var dbFile = './data/vivoCache.db';
var dbExists = fs.existsSync(dbFile);

// var redis = require("redis");

// var redisClient = redis.createClient();
// redisClient.on("error", function (err) {
//     console.log("Error " + err);
// });
var getAllPublicationDetailsQuery = '';
var getAllPeopleQuery = '';
var getAllJournalsQuery = '';
var getAllEventsQuery = '';

/********* temp ********/
var publicationDetails = '';
/***********************/

fs.readFile('./templates/getAllPublicationDetails.ttl', function read(err, data) {
    if (err) {
        throw err;
    }
    getAllPublicationDetailsQuery = data.toString();
});

fs.readFile('./templates/getAllPeople.ttl', function read(err, data) {
    if (err) {
        throw err;
    }
    getAllPeopleQuery = data.toString();
});

fs.readFile('./templates/getAllJournals.ttl', function read(err, data) {
    if (err) {
        throw err;
    }
    getAllJournalsQuery = data.toString();
});

fs.readFile('./templates/getAllEvents.ttl', function read(err, data) {
    if (err) {
        throw err;
    }
    getAllEventsQuery = data.toString();
});

fs.readFile('./templates/getAllPublicationDetails.json', function read(err, data) {
    if (err) {
        throw err;
    }
    publicationDetails = data.toString();
});


var executeQuery = function(sparqlRDF, cb){
    cb([{},publicationDetails]);
/*	var data = {
		email: 'vivo_root@school.edu',
		password:'test123',
		query: sparqlRDF
	};

	var response = request({
        headers: {
          'Accept': 'application/sparql-results+json'
        },
		uri: 'http://localhost:8070/vivo/api/sparqlQuery',
		method: 'POST',
		form: data
	});
	
	response.then(function (resp) {
		if (resp.statusCode >= 300) {
			throw new Error('Server responded with status code ' + resp.statusCode)
		} else {	
			cb(resp);
		}
	});*/
};
//todo: create property extSourceID in vivo and retrieve it
var updatePublicationsList = function () {
    var db = new sqlite3.Database(dbFile);
    var publicationsParsed = {}, tempPublication = {}, publication = {}, args = [], i = 0, queryValues = {};
    executeQuery(getAllPublicationDetailsQuery, function(resp){
        publicationsParsed = JSON.parse(resp[1]);
        for(i in publicationsParsed.results.bindings){
            tempPublication = publicationsParsed.results.bindings[i];
            publication = new P.Publication({
                authorVivoID: tempPublication.publication && tempPublication.publication.value,
                key: tempPublication.publication && tempPublication.publication.value,
                authors: tempPublication.authors && tempPublication.authors.value,
                title: tempPublication.title && tempPublication.title.value,
                journal: tempPublication.publicationVenue && tempPublication.publicationVenue.value,
                conference: tempPublication.presentedAt && tempPublication.presentedAt.value,
                publicationDate: tempPublication.date && tempPublication.date.value,
                pageStart: tempPublication.pageStart && tempPublication.pageStart.value,
                pageEnd: tempPublication.pageEnd && tempPublication.pageEnd.value,
                doi: tempPublication.doi && tempPublication.doi.value,
                issue: tempPublication.issue && tempPublication.issue.value,
                volume: tempPublication.volume && tempPublication.volume.value,
                }
            );
            // args = ["Publications:<" + publication.key + ">"];
            // Array.prototype.push.apply(args,publication.getREDISmsetArray());
            // args.push(function (err, res) {
            //     console.log(res || err);            
            // });

            db.serialize(function() {
                queryValues = publication.getInsertQueryValues();
                db.run('INSERT OR REPLACE INTO Publications (' + queryValues.keys.join(',') + ') VALUES(' + Array(queryValues.values.length +1 ).join('?').split('').join(',') 
                    + ')', queryValues.values, function(error){
                    if(error){
                        console.log(error);
                        db.close();
                    }
                }); 

                // db.run("DELETE from Publications where key='?'", [publication.key], function(error){
                //     if(error) {
                //         console.log(error);
                //     }
                //     else{ 
                //     }
                // });

                // var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
                // for (var i = 0; i < 10; i++) {
                //   stmt.run("Ipsum " + i);
                // }
                // stmt.finalize();

                // db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
                //     console.log(row.id + ": " + row.info);
                // });
            });

            // redisClient.hmset.apply(redisClient, args);
        }
        db.close();
    });
}

var updatePeopleList = function () {
    var publicationsParsed = {}, tempPublication = {}, publication = {}, args = [], i = 0;

    executeQuery(getAllPublicationDetailsQuery, function(resp){
        publicationsParsed = JSON.parse(resp[1]);
        for(i in publicationsParsed.results.bindings){
            tempPublication = publicationsParsed.results.bindings[i];
            publication = new P.Publication({
                key: tempPublication.publication && tempPublication.publication.value,
                authors: tempPublication.authors && tempPublication.authors.value,
                authors: tempPublication.authors && tempPublication.authors.value,
                title: tempPublication.title && tempPublication.title.value,
                journal: tempPublication.publicationVenue && tempPublication.publicationVenue.value,
                conference: tempPublication.presentedAt && tempPublication.presentedAt.value,
                publicationDate: tempPublication.date && tempPublication.date.value,
                pageStart: tempPublication.pageStart && tempPublication.pageStart.value,
                pageEnd: tempPublication.pageEnd && tempPublication.pageEnd.value,
                doi: tempPublication.doi && tempPublication.doi.value,
                issue: tempPublication.issue && tempPublication.issue.value,
                volume: tempPublication.volume && tempPublication.volume.value,
            });

            args = ["Publications:<" + publication.key + ">"];
            Array.prototype.push.apply(args,publication.getREDISmsetArray());
            args.push(function (err, res) {
                console.log(res || err);            
            });
            redisClient.hmset.apply(redisClient, args);
        }
    });
}

var createDB = function (cb) {
    var pub = new P.Publication({});
    //if not exists
    var createQuery = pub.getCreateQuery();
    db.serialize(function() {
        db.run(createQuery, function(error){
            if(error)
                console.log(error);
            else 
                cb();
        });
    });
}

exports.UpdateCacheLists =  function () { 
    updatePublicationsList();
};
exports.CreateDB = createDB;