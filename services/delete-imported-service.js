var fs = require('fs');
var Q = require('q');
var request = Q.denodeify(require('request'));

var sqlite3 = require('sqlite3').verbose();
var dbFile = './data/vivoCache.db';
var dbExists = fs.existsSync(dbFile);

var deleteImportedPublicationsQuery = '';
var deleteImportedPeopleQuery = '';
var getAllJournalsQuery = '';
var getAllEventsQuery = '';


fs.readFile('./templates/deleteImportedPublications.ttl', function read(err, data) {
    if (err) {
        throw err;
    }
    deleteImportedPublicationsQuery = data.toString();
});

fs.readFile('./templates/deleteImportedPeople.ttl', function read(err, data) {
    if (err) {
        throw err;
    }
    deleteImportedPeopleQuery = data.toString();
});

var executeQuery = function(sparqlRDF, cb){
    // cb([{},publicationDetails]);
	var data = {
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
	});
};



var deleteImported =  function (cb) { 
    executeQuery(deleteImportedPublicationsQuery, function(response){
        console.log(response);
        throw new Error(response);
        cb(response);
    });
    // executeQuery(deleteImportedPeopleQuery, function(response){
    //     console.log(response);
    //     cb();
    // });

};

exports.DeleteImported = deleteImported;