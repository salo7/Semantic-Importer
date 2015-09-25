var Q = require('q');
var request = Q.denodeify(require('request'));
var parseString = require('xml2js').parseString;

exports.searchByAuthor = function(isExtensiveSearch, authorName, cb){
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
			console.log('Before parsePubmedAuthorSearchXml');
			var innerRsponse = parsePubmedAuthorSearchXml(resp.body);
			innerRsponse.then(function (innerResp) {					
				console.log('After innerRsponse');
				innerResp = innerResp[0];
				var returnPublications = parsePubmedAuthorSearchByIDXml(innerResp.body);
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
	global.LogToFile(util.format(authorIDs.join()));
	
	resultsNum = authorIDs.length;
	var response = request({
		uri: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=' + authorIDs.join(),
		method: 'GET'
	});	
	
	return response;
}

function parsePubmedAuthorSearchByIDXml(response){
	var responseObject, respAuthor, publication, authorsList;
	var publicationsXmlList = [];
	var returnPublications = [];
	
	parseString(response, function (err, result) {
		responseObject = result;
	});	
	
	publicationsXmlList = responseObject.eSummaryResult.DocSum;
	//global.LogToFile(publicationsXmlList[0]);
		
	for(var j in publicationsXmlList){
		respAuthor = publicationsXmlList[j];
		authorsList = respAuthor.Item[3].Item.map(
		  function(item) { return item._; }
		);
		publication = {
			pubmedID: respAuthor.Id,
			type : "",
			key : "",
			mdate : respAuthor.Item[0]._,
			authors : authorsList,
			title : respAuthor.Item[5]._,
			pages : respAuthor.Item[8]._,
			year : "",
			booktitle : respAuthor.Item[22]._,
			url : "",
			ee : ""
		};
		console.log(publication);
		returnPublications.push(publication);
	}
	
	return returnPublications;
}