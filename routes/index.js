var express = require('express');
var session = require('express-session');
var util = require('util');
var dblpService = require('../services/dblp-service.js');
var pubmedService = require('../services/pubmed-service.js');
var vivoService = require('../services/vivo-service.js');
var cacheUpdateService = require('../services/cache-update-service.js');
var winston = require('winston');
var bodyParser = require('body-parser');
var router = express.Router();
var P = require('../models/publication.js');


var sessionHandler = session({
	secret: 'hqo263HPD2Q983H',
	saveUninitialized: true,
	resave: true
});

/* GET home page. */
router.get('/', sessionHandler, function(req, res, next) {
	res.render('search-author', { search: "", returnAuthors:[] , authorName:"", resultsNum:0, engine:"dblp"});
});

router.get('/import', sessionHandler, function(req, res, next) {
	res.render('import', { });
});

router.post('/import', sessionHandler, function(req, res, next) {
	var engine = req.query.engine;
	var selectedPubs = [];
	if(typeof req.body.extSourceID === 'string'){
		selectedPubs.push(new P.Publication(req.session.publications[req.body.extSourceID]));	
	}
	else{
		for(var i in req.body.extSourceID){		
			selectedPubs.push(new P.Publication(req.session.publications[req.body.extSourceID[i]]));
		}	
	}
	vivoService.insertPublicationsIntoVivo(req.query.vivoID, selectedPubs, engine, function(msg){
		res.render('import', { msg: msg});		
	});
});

router.get('/searchAuthor', sessionHandler, function(req, res, next) {
	winston.log('debug','Into searchAuthor route');
	var authorName = req.query.authorName;
	var engine = req.query.engine;
	var isExtensiveSearch = !!req.query.extensiveSearch;
	req.session.vivoID = req.query.vivoID;
	
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
		pubmedService.searchByAuthor(isExtensiveSearch, authorName, req.session.vivoID,function(returnPublications){
			req.session.publications = returnPublications;
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

router.get('/searchPublications', sessionHandler, function(req, res, next) {	
	winston.log('debug','Into searchPublications route');
	var dblpUserID = req.query.urlpt;
	var authorName = req.body.authorName;
	
	dblpService.searchPublications(dblpUserID, authorName, function(returnPublications){
		req.session.publications = returnPublications;
		res.render('search-publication', { 
			authorName: authorName, 
			returnPublications: returnPublications, 
			resultsNum: returnPublications.length ,
			engine: 'dblp'
		});	
	});	
});

router.get('/test', sessionHandler, function(req, res, next){
	vivoService.testVivoUpdate();
});


router.get('/cacheUpdate', sessionHandler, function(req, res, next) {
	cacheUpdateService.UpdateCacheLists();
});


router.get('/createDB', sessionHandler, function(req, res, next) {
	cacheUpdateService.CreateDB(function(){
		res.redirect('/');
	});
});

module.exports = router;