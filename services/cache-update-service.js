var fs = require('fs');
var Q = require('q');
var request = Q.denodeify(require('request'));
var P = require('../models/publication.js');
var PE = require('../models/person.js');
var config = require('../config/config.js').config;

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
    // cb([{},publicationDetails]);
	var data = {
        email: config.vivo.username,
        password:config.vivo.password,
		query: sparqlRDF
	};

	var response = request({
        headers: {
          'Accept': 'application/sparql-results+json'
        },
		uri: config.vivo.sparqlQueryUrl,
		method: 'POST',
		form: data
	});
	
	response.then(function (resp) {
		if (resp.statusCode >= 300) {
			throw new Error('Server responded with status code ' + resp.statusCode)
		} else {	
			cb(resp);
		}
	});
};

var insertPublications = function(publications, cb){
    var publication;
    var publicationsSize = publications.length;
    var db = new sqlite3.Database(dbFile);

    for (var i = publications.length - 1; i >= 0; i--) {
        publication = publications[i];
        queryValues = publication.getInsertQueryValues();
        db.run('INSERT OR REPLACE INTO Publications (' + queryValues.keys.join(',') + ') VALUES(' + Array(queryValues.values.length +1 ).join('?').split('').join(',') 
            + ')', queryValues.values, function(error){
            if(error){
                console.log(error);
                db.close();
            }
            //make sure that this was the last query executed
            if (--publicationsSize === 0) {
                db.close();
                cb();                        
            };
        });     
    };
}


var updatePublicationsList = function (cb) {
    var db = new sqlite3.Database(dbFile);
    var publicationsParsed = {}, tempPublication = {}, publications = [], args = [], i = 0, j = 0,queryValues = {}, authors=[];
    var returned = false;
    var publicationsSize;

    executeQuery(getAllPublicationDetailsQuery, function(resp){
        publicationsParsed = JSON.parse(resp[1]);
        publicationsSize = publicationsParsed.results.bindings.length;
        for(i in publicationsParsed.results.bindings){
            tempPublication = publicationsParsed.results.bindings[i];
            publications.push (new P.Publication({
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
                extSourceID: tempPublication.extSourceID && tempPublication.extSourceID.value,
                }
            ));
        }
        insertPublications(publications, cb);

    });
}

var updatePeopleList = function () {
    var db = new sqlite3.Database(dbFile);
    var peopleParsed = {}, tempPerson = {}, person = {}, args = [], i = 0;

    executeQuery(getAllPeopleQuery, function(resp){
        peopleParsed = JSON.parse(resp[1]);
        for(i in peopleParsed.results.bindings){
            tempPerson = peopleParsed.results.bindings[i];

            person = new PE.Person({
                id: tempPerson.personID && tempPerson.personID.value,
                name: tempPerson.name && tempPerson.name.value                
            });
            
            db.run('INSERT OR REPLACE INTO Persons (id, name) VALUES(?,?)', [person.id, person.name], function(error){
                if(error){
                    console.log(error);
                    db.close();
                }
            }); 
        }
    });
}

var createDB = function (cb) {
    var db = new sqlite3.Database(dbFile);
    var pub = new P.Publication({});
    var person = new PE.Person({});
    var pubCreateQuery = pub.getCreateQuery(); 

    db.serialize(function() {
        db.run(person.createQuery, function(error){
            if(error)
                console.log(error);
        });
        db.run(pubCreateQuery, function(error){
            if(error)
                console.log(error);
        });
        db.run( 'CREATE TABLE IF NOT EXISTS `DblpCache` ( `url` TEXT, `xml` BLOB, PRIMARY KEY(url));', function(error){
            if(error)
                console.log(error);
            cb();
        });

    });
    db.close();
}

exports.UpdateCacheLists =  function (cb) { 
    createDB(function(){        
        updatePeopleList();
        updatePublicationsList(cb);
    });
};
exports.InsertPublications = insertPublications;
exports.CreateDB = createDB;