var Q = require('q');
var request = Q.denodeify(require('request'));
var parseString = require('xml2js').parseString;
var winston = require('winston');
var P = require('../models/publication.js');


exports.searchByAuthor = function(isExtensiveSearch, authorName, vivoID, cb){
	winston.log('debug','Into searchByAuthor pubmed-service');
	if(!isExtensiveSearch){
		authorName = authorName + '[Author]';
	}
	
	var response = request({
		uri: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=' + authorName,
		method: 'GET'
	});
	
	response.then(function (resp) {
		resp = resp[0];
		if (resp.statusCode >= 300) {
		  throw new Error('Server responded with status code ' + resp.statusCode)
		} else {
			winston.log('debug', 'Before parsePubmedAuthorSearchXml');
			var innerRsponse = parsePubmedAuthorSearchXml(resp.body);
			innerRsponse.then(function (innerResp) {					
				winston.log('debug', 'After innerRsponse');
				innerResp = innerResp[0];						
				var returnPublications = parsePubmedAuthorSearchByIDXml(innerResp.body, vivoID);
				winston.log('debug', typeof cb);
				cb(returnPublications);
			});
		}
	});
};

function parsePubmedAuthorSearchXml(response){
	var responseObject;
	var authorIDs = [];
	parseString(response, function (err, result) {
		responseObject = result;
	});
	authorIDs = responseObject.eSearchResult.IdList[0].Id;
	
	resultsNum = authorIDs.length;
	var response = request({
		uri: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=' + authorIDs.join(),
		method: 'GET'
	});	
	
	return response;
}

function parsePubmedAuthorSearchByIDXml(response, vivoID){		
	winston.log('debug', 'In parsePubmedAuthorSearchByIDXml');
	var responseObject, respAuthor, publication, authorsList;
	var publicationsXmlList = [];
	var returnPublications = {};
	
	parseString(response, function (err, result) {
		winston.log('debug', 'In parsePubmedAuthorSearchByIDXml -> parseString');
		responseObject = result;
	});
	
	publicationsXmlList = responseObject.eSummaryResult.DocSum;
	//global.LogToFile(publicationsXmlList[0]);
		
	for(var j in publicationsXmlList){
		respAuthor = publicationsXmlList[j];
		authorsList = respAuthor.Item[3].Item.map(
		  function(item) { return item._; }
		);
		publication = P.Publication(
			vivoID,
			respAuthor.Id, 
			"", 
			"", 
			respAuthor.Item[0]._, 
			authorsList, 
			respAuthor.Item[5]._, 
			respAuthor.Item[8]._, 
			"", 
			respAuthor.Item[22]._, 
			"", 
			"" 
		);
		returnPublications[respAuthor.Id] = publication;
	}	
		
	winston.log('debug', 'Out parsePubmedAuthorSearchByIDXml');
	return returnPublications;
}