var express = require('express');
var util = require('util');
var http = require('http');
var parseString = require('xml2js').parseString;
var Q = require('q');
var request = Q.denodeify(require('request'))

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('search-author', { search: "", returnAuthors:[] , authorName:"", resultsNum:0, engine:"dblp"});
});

router.get('/import', function(req, res, next) {
	res.render('import', { });
});
router.post('/import', function(req, res, next) {
	res.render('import', { });
});

router.get('/searchAuthor', function(req, res, next) {
	var authorName = req.query.authorName;
	var engine = req.query.engine;
	var isExtensiveSearch = !!req.query.extensiveSearch
	
	if(!(authorName && engine) ){
		res.render('search-author', { search: "", returnAuthors:[] , authorName:"", resultsNum:0, engine:"dblp"});
		return;
	}
	if(engine=="dblp"){
		if(!isExtensiveSearch){
			authorName = authorName.split(' ').join('$') + '$';
		}
		var response = request({
			uri: 'http://dblp.uni-trier.de/search/author?xauthor=' + authorName,
			method: 'GET'
		});
		console.log('Done get request');
		response.then(function (resp) {
			resp = resp[0];
			if (resp.statusCode >= 300) {
			  throw new Error('Server responded with status code ' + resp.statusCode)
			} else {
				var result = parseDBLPAuthorSearchXml(resp.body);
				result.search= req.query.authorName;
				result.isExtensiveSearch = isExtensiveSearch;
				result.engine = engine;
				result.authorName = authorName;
				console.log('result');
				console.log(result);
				res.render( 'search-author', result);	
			}
		  });
				
	}
	else if(engine=="pubmed"){
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
					var innerResult = parsePubmedAuthorSearchByIDXml(innerResp.body);
					res.render( 'search-publication', { 
						authorName: authorName, 
						returnPublications:innerResult.returnPublications, 
						resultsNum:innerResult.resultsNum,
						engine:engine
					});	
				});
			}
		  });			
	  }	
});

router.get('/searchPublications', function(req, res, next) {
	
	var returnPublications = [];
	var authorName = req.body.authorName;
	var options = {
		hostname: "dblp.uni-trier.de",
		path: '/pers/xk/' + req.query.urlpt
	};

    var gsaReq = http.get(options, function (response) {
        var completeResponse = '';
		var responseObject;
		var respPub;
		var authorName;
		
        response.on('data', function (chunk) {
            completeResponse += chunk;
        });
        response.on('end', function() {
			parseString(completeResponse, function (err, result) {
				responseObject = result;
			});
			console.log(responseObject.dblpperson.dblpkey[0]);
			
			authorName=responseObject.dblpperson['$'].name;
			
			var length = responseObject.dblpperson.dblpkey.length;
			var lastDblpKey =  responseObject.dblpperson.dblpkey[length-1];
			
			console.log('Number of records');
			console.log(responseObject.dblpperson.dblpkey.length);
			console.log('for author');
			console.log(authorName);
			
			
			for(var j=0; j < responseObject.dblpperson.dblpkey.length; j++){
				if(j>0){
					var dblpkey = responseObject.dblpperson.dblpkey[j];
					
					var optionsDetails = {
						hostname: "dblp.uni-trier.de",
						path: '/rec/xml/' + dblpkey
					};
					(function(dblpkey){
						var gsaReqDetails = http.get(optionsDetails, function (responseDetails) {
							var completeResponseDetails = '';
							var responseObjectDetails;		
							
							responseDetails.on('data', function (chunkDetails) {
								completeResponseDetails += chunkDetails;
							});
							responseDetails.on('end', function() {
								parseString(completeResponseDetails, function (err, resultDetails) {
									responseObjectDetails = resultDetails;
								});
								respPub = {};
								respPub.dblpkey = dblpkey;
								
								console.log('<Object.keys issue>');
								console.log(responseObjectDetails);
								console.log('</Object.keys issue>');
								
								var key = Object.keys( responseObjectDetails.dblp)[0];
								var details = responseObjectDetails.dblp[key][0];
								
								respPub.type = key;
								respPub.key = details['$'].key;
								respPub.mdate = details['$'].mdate;
								respPub.authors = details.author;
								respPub.title = details.title && details.title[0];
								respPub.pages = details.pages && details.pages[0];
								respPub.year = details.year && details.year[0];
								respPub.booktitle = details.booktitle  &&  details.booktitle[0];
								respPub.url = details.url && details.url[0];
								respPub.ee = details.ee && details.ee[0];
								returnPublications.push(respPub);
								
								console.log('<index issue>');
								console.log(lastDblpKey === dblpkey);
								console.log('</index issue>');
								
								if(lastDblpKey === dblpkey){
									res.render('search-publication', { 
										authorName: authorName, 
										returnPublications:returnPublications, 
										resultsNum:length ,
										engine:'dblp'
									});						
								}
							});
						}).on('error', function (e) {
							console.log('problem with request: ' + e.message);
						});
					})(dblpkey);
					
				}
			}
			
        })
	}).on('error', function (e) {
		console.log('problem with request: ' + e.message);
	});
	
});

function parseDBLPAuthorSearchXml(response){
	var responseObject, respAuthor, authorObj;
	var returnAuthors = [];
	parseString(response, function (err, result) {
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
	var returnObj = { 
		returnAuthors:returnAuthors ,  
		resultsNum:resultsNum 
	};
	return returnObj;
}

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
	
	resultsNum = publicationsXmlList.length;
	
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
	
	console.log('4');
	return {returnPublications:returnPublications, resultsNum:resultsNum};
}


module.exports = router;
