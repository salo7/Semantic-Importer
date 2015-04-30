var Q = require('q');
var request = Q.denodeify(require('request'));
var parseString = require('xml2js').parseString;
var winston = require('winston');

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
	winston.log('debug','Into searchPublications dblp-service');
	
	var returnPublications = [];
	
	var response = request({
		uri: 'http://dblp.uni-trier.de/pers/xk/' + dblpUserID,
		method: 'GET'
	});	
	
	response.then(function (resp) {
		var responseObject;
		var returnPublications = [];
        var completeResponse = '';
		var respPub;
		var authorName;
		resp = resp[0];
		if (resp.statusCode >= 300) {
			throw new Error('Server responded with status code ' + resp.statusCode)
		} else {		
			parseString(resp.body, function (err, result) {
				responseObject = result;
				winston.log('debug',responseObject.dblpperson.dblpkey[0]);
				
				authorName=responseObject.dblpperson['$'].name;
				
				var length = responseObject.dblpperson.dblpkey.length;
				var lastDblpKey =  responseObject.dblpperson.dblpkey[length-1];
				
				winston.log('debug','Number of records');
				winston.log('debug',responseObject.dblpperson.dblpkey.length);
				winston.log('debug','for author');
				winston.log('debug',authorName);
				
				
				for(var j=0; j < responseObject.dblpperson.dblpkey.length; j++){
					if(j>0){
						var dblpkey = responseObject.dblpperson.dblpkey[j];						
						
						var response = request({
							uri: 'http://dblp.uni-trier.de/rec/xml/' + dblpkey,
							method: 'GET'
						});	
						
						(function(dblpkey){
						
							response.then(function (resp) {
								var responseObjectDetails;	
								resp = resp[0];
								if (resp.statusCode >= 300) {
									throw new Error('Server responded with status code ' + resp.statusCode)
								} else {		
									parseString(resp.body, function (err, resultDetails) {
										responseObjectDetails = resultDetails;
										respPub = {};
										respPub.dblpkey = dblpkey;
										
										winston.log('debug','<Object.keys issue>');
										winston.log('debug',responseObjectDetails);
										winston.log('debug','</Object.keys issue>');
										
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
										
										winston.log('debug','<index issue>');
										winston.log('debug',lastDblpKey === dblpkey);
										winston.log('debug','</index issue>');
										
										if(respPub.authors){
											winston.log('debug', details);
										}
										if(lastDblpKey === dblpkey){
											cb(returnPublications);				
										}									
									});
								}
							});
						})(dblpkey);						
					}
				}		
			});
		}
	});
};