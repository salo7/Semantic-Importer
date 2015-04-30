var Q = require('q');
var request = Q.denodeify(require('request'));
var parseString = require('xml2js').parseString;
var http = require('http');
var util = require('util');

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

exports.searchPublications = function (dblpUserID, authorName, cb){
	
	var returnPublications = [];
	
	var options = {
		hostname: "dblp.uni-trier.de",
		path: '/pers/xk/' + dblpUserID
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
										respPub.editors = details.editor;
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
										
										if(respPub.authors){
											global.LogToFile(util.format(details));
										}
										if(lastDblpKey === dblpkey){
											cb(returnPublications);				
										}									
									});
								});
							}).on('error', function (e) {
								console.log('problem with request: ' + e.message);
							});
						})(dblpkey);						
					}
				}			
			});
        });
	}).on('error', function (e) {
		console.log('problem with request: ' + e.message);
	});	
};