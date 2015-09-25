var uuid = require('node-uuid');
var fs = require('fs');
var Q = require('q');
var request = Q.denodeify(require('request'));
var Publication = require('../models/publication.js');
var cache = require('../services/cache-update-service.js');
var config = require('../config/config.js').config;

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

var createVivoInsert = function(vivoID, publications, extSource){
	var publicationItemsRDF = '';
  console.time("rdfCreation");
	for(var i in publications){
		// publicationItemsRDF += Publication.createPublicationRDF(publications[i]);
		publicationItemsRDF += publications[i].createPublicationRDF(vivoID, extSource);
	}
	
	var publicationVivoRDF = publicationVivoRDFTemplate
		.replace(/{{publicationVivoRDF}}/g, publicationItemsRDF);
	
  console.timeEnd("rdfCreation");
	return publicationVivoRDF;
};

var executeVivoUpdate = function(sparqlRDF, cb){

  console.time("vivoImport");
	var data = {
		email: config.vivo.username,
		password:config.vivo.password,
		update: sparqlRDF
	};

	var response = request({
		uri: config.vivo.sparqlUpdateUrl,
		method: 'POST',
		form: data
	});
	
	response.then(function (resp) {
  	console.timeEnd("vivoImport");
		if (resp.statusCode >= 300) {
			throw new Error('Server responded with status code ' + resp.statusCode)
		} else {	
			cb(resp[1]);
		}
	});
};

exports.insertPublicationsIntoVivo = function(vivoID, publications, extSource, cb){
	var rdf = createVivoInsert(vivoID, publications, extSource);
	console.log(rdf);
	//temp
	fs.writeFile("./tmp/rdf.ttl", rdf, function(err) {
	    if(err) {
	        return console.log(err);
	    }

	    console.log("The file was saved!");
	}); 
	executeVivoUpdate(rdf, function(){
		cache.InsertPublications(publications, cb);
	});
};

exports.testVivoUpdate = function(){
	var data = {
		email: config.vivo.username,
		password:config.vivo.password,
		update: insertPubTmpl
	};

	var response = request({
		uri: config.vivo.sparqlUpdateUrl,
		method: 'POST',
		form: data
	});
	
	response.then(function (resp) {
		console.log('success or what?');
	});
};