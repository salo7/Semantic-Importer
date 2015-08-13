var fs = require('fs');
var Q = require('q');
var request = Q.denodeify(require('request'));
var Publication = require('../models/publication.js');

var publicationVivoRDFTemplate = '';
var insertPubTmpl = '';

fs.readFile('./templates/publicationVivoRDFTempate.ttl', function read(err, data) {
    if (err) {
        throw err;
    }
    publicationVivoRDFTemplate = data.toString();
});


fs.readFile('./templates/insert-publication.ttl', function read(err, data) {
    if (err) {
        throw err;
    }
    insertPubTmpl = data.toString();
});

var createVivoInsert = function(vivoID, publications){
	var publicationItemsRDF = '';
	for(var i in publications){
		// publicationItemsRDF += Publication.createPublicationRDF(publications[i]);
		publicationItemsRDF += publications[i].createPublicationRDF(vivoID);
	}
	
	var publicationVivoRDF = publicationVivoRDFTemplate
		.replace(/{{publicationVivoRDF}}/g, publicationItemsRDF);
	
	return publicationVivoRDF;
};

var executeVivoUpdate = function(sparqlRDF, cb){

	var data = {
		email: 'vivo_root@school.edu',
		password:'test123',
		update: sparqlRDF
	};

	var response = request({
		uri: 'http://localhost:8070/vivo/api/sparqlUpdate',
		method: 'POST',
		form: data
	});
	
	response.then(function (resp) {
		if (resp.statusCode >= 300) {
			throw new Error('Server responded with status code ' + resp.statusCode)
		} else {	
			cb(resp[1]);
		}
	});
};

exports.insertPublicationsIntoVivo = function(vivoID, publications, cb){
	var rdf = createVivoInsert(vivoID, publications);
	console.log(rdf);
	executeVivoUpdate(rdf, cb);
};

exports.testVivoUpdate = function(){
	var data = {
		email: 'vivo_root@school.edu',
		password:'test123',
		update: insertPubTmpl
	};

	var response = request({
		uri: 'http://localhost:8070/vivo/api/sparqlUpdate',
		method: 'POST',
		form: data
	});
	
	response.then(function (resp) {
		console.log('success or what?');
	});
};