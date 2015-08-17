var Q = require('q');
var request = Q.denodeify(require('request'));
var parseString = require('xml2js').parseString;
var winston = require('winston');
var P = require('../models/publication.js');


exports.searchByAuthor = function(isExtensiveSearch, authorName, vivoID, cb){
	var returnPublications = [];
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
			if (!innerRsponse) {
				cb(returnPublications);
			};
			innerRsponse.then(function (innerResp) {					
				winston.log('debug', 'After innerRsponse');
				innerResp = innerResp[0];						
				returnPublications = parsePubmedAuthorSearchByIDXml(innerResp.body, vivoID);
				winston.log('debug', typeof cb);
				cb(returnPublications);
			});
		}
	});
};

function parsePubmedAuthorSearchXml(response){
	var authorIDs = [];
	var responseObject = '';
	parseString(response, function (err, result) {
		responseObject = result;
	});

	if (responseObject.eSearchResult.Count[0] === "0" ) {
		return null;
	};

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
	var responseObject, respItem, publication, authorsList;
	var publicationsXmlList = [];
	var returnPublications = {};
	
	parseString(response, function (err, result) {
		winston.log('debug', 'In parsePubmedAuthorSearchByIDXml -> parseString');
		responseObject = result;
	});
	
	publicationsXmlList = responseObject.eSummaryResult.DocSum;
	//global.LogToFile(publicationsXmlList[0]);
		
	for(var j in publicationsXmlList){
		respItem = publicationsXmlList[j];
		authorsList = respItem.Item[3].Item.map(
		  function(item) { return item._; }
		);

		publication = {};
		publication.extSourceID = respItem.Id[0];
		publication.type = vivoID;
		publication.key = "";
		publication.mdate = respItem.Item[0]._;
		publication.authors = authorsList;
		publication.editors = [];
		publication.title = respItem.Item[5]._;
		publication.pages = respItem.Item[8]._;
		publication.year = "";
		publication.booktitle = respItem.Item[22]._;
		publication.url = "";
		publication.ee = "";
		// var test = [
		// 	vivoID,
		// 	respItem.Id, 
		// 	"", 
		// 	"", 
		// 	respItem.Item[0]._, 
		// 	authorsList, 
		// 	respItem.Item[5]._, 
		// 	respItem.Item[8]._, 
		// 	"", 
		// 	respItem.Item[22]._, 
		// 	"", 
		// 	"" ];
		returnPublications[respItem.Id] = new P.Publication(publication);
	}	
		
	winston.log('debug', 'Out parsePubmedAuthorSearchByIDXml');
	return returnPublications;
}