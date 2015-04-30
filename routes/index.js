var express = require('express');
var util = require('util');
var dblpService = require('../services/dblp-service.js');
var pubmedService = require('../services/pubmed-service.js');
var winston = require('winston');

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
	winston.log('debug','Into searchAuthor route');
	var authorName = req.query.authorName;
	var engine = req.query.engine;
	var isExtensiveSearch = !!req.query.extensiveSearch;
	
	if(!(authorName && engine) ){
		res.render('search-author', { search: "", returnAuthors:[] , authorName:"", resultsNum:0, engine:"dblp"});
		return;
	}
	
	if(engine=="dblp"){
		winston.log('debug','Calling searchAuthors dblp-service');
		dblpService.searchAuthors(isExtensiveSearch, authorName, function(returnAuthors){
			winston.log('debug', 'In cb');
			var result = {
				returnAuthors: returnAuthors,
				resultsNum: resultsNum.length,
				search: req.query.authorName,
				isExtensiveSearch: isExtensiveSearch,
				engine: engine,
				authorName: authorName			
			};			 
			res.render( 'search-author', result);	
		});				
	}
	
	else if(engine=="pubmed"){
		winston.log('debug','Calling searchByAuthor pubmed-service');
		pubmedService.searchByAuthor(isExtensiveSearch, authorName, function(returnPublications){
			winston.log('debug', 'In cb');
			res.render( 'search-publication', { 
				authorName: authorName, 
				returnPublications:returnPublications, 
				resultsNum:returnPublications.length,
				engine:engine
			});				
		});	
	}	
});

router.get('/searchPublications', function(req, res, next) {	
	winston.log('debug','Into searchPublications route');
	var dblpUserID = req.query.urlpt;
	var authorName = req.body.authorName;
	
	dblpService.searchPublications(dblpUserID, authorName, function(returnPublications){
		res.render('search-publication', { 
			authorName: authorName, 
			returnPublications: returnPublications, 
			resultsNum: returnPublications.length ,
			engine: 'dblp'
		});	
	});	
});

module.exports = router;