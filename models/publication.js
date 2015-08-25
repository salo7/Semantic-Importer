var uuid = require('node-uuid');
var fs = require('fs');
var dateUtils = require('../utilities/date-utilities.js');

var journalTemplate, dateTimeTemplate, eventTemplate, publicationTypeTemplate, authorTemplate, editorTemplate;
var publicationVivoUriToken = '{{publicationVivoUri}}'; 
var publicationVivoUriTempl = '<http://vivo.iai.uni-bonn.de/vivo/individual/{{extSource}}-{{extSourceID}}>';

var titleTemplate = publicationVivoUriToken + ' rdfs:label "{{title}}".';
var pageEndTemplate = publicationVivoUriToken + ' rdfs:label "{{pageEnd}}".';
var pageStartTemplate = publicationVivoUriToken + ' rdfs:label "{{pageStart}}".';
var volumeTemplate = publicationVivoUriToken + ' rdfs:label "{{volume}}".';
var doiTemplate = publicationVivoUriToken + ' rdfs:label "{{doi}}".';
var issueTemplate = publicationVivoUriToken + ' rdfs:label "{{issue}}".';


fs.readFile('./templates/publicationType-template.ttl.part', function read(err, data) {
    if (err) {
        throw err;
    }
    publicationTypeTemplate = data.toString();
});
fs.readFile('./templates/dateTime-template.ttl.part', function read(err, data) {
    if (err) {
        throw err;
    }
    dateTimeTemplate = data.toString();
});

fs.readFile('./templates/event-template.ttl.part', function read(err, data) {
    if (err) {
        throw err;
    }
    eventTemplate = data.toString();
});

fs.readFile('./templates/journal-template.ttl.part', function read(err, data) {
    if (err) {
        throw err;
    }
    journalTemplate = data.toString();
});


fs.readFile('./templates/author-template.ttl.part', function read(err, data) {
    if (err) {
        throw err;
    }
    authorTemplate = data.toString();
});

fs.readFile('./templates/editor-template.ttl.part', function read(err, data) {
    if (err) {
        throw err;
    }
    editorTemplate = data.toString();
});

// For each new entity we must query the redis and if its the same decide which uri to use
var compilePublicationRDF = function(authorVivoURI, extSource){
    var publicationVivoUri = '';

	var publicationVivoRDF = publicationTypeTemplate + 
        (this.title && titleTemplate.replace(/{{title}}/g, this.title)) + 
        (this.pageStart && titleTemplate.replace(/{{pageStart}}/g, this.pageStart)) + 
        (this.pageEnd && titleTemplate.replace(/{{pageEnd}}/g, this.pageEnd)) + 
        (this.volume && titleTemplate.replace(/{{volume}}/g, this.volume)) + 
        (this.doi && titleTemplate.replace(/{{doi}}/g, this.doi)) + 
        (this.issue && titleTemplate.replace(/{{issue}}/g, this.issue)) + 
        (this.publicationDate && dateTimeTemplate
			.replace(/{{dateTimeUUID}}/g, uuid.v4())
			.replace(/{{dateXMLFormat}}/g, dateUtils.getXMLDateFormat(this.publicationDate)))  + //is it a Date object? 
        (this.conference && titleTemplate
			.replace(/{{conferenceName}}/g, this.conference)
			.replace(/{{conferenceUUID}}/g, uuid.v4())) + 
		(this.journal && titleTemplate
			.replace(/{{journalName}}/g, this.journal)
			.replace(/{{journalUUID}}/g, uuid.v4()));

	var authors = this.authors;
	for (var i in authors) {
		var authorName = authors[i];
		publicationVivoRDF += authorTemplate
			.replace(/{{personUUID}}/g, uuid.v4())
			.replace(/{{authorName}}/g, authorName)
			.replace(/{{authorshipUUID}}/g, uuid.v4())
		;
	};

	var editors = this.editors;
	for (var i in editors) {
		var editorName = editors[i];
		publicationVivoRDF += editorTemplate
			.replace(/{{personUUID}}/g, uuid.v4())
			.replace(/{{authorName}}/g, editorName)
			.replace(/{{editorshipUUID}}/g, uuid.v4())
		;
	};

    // 1st check if the publication exists
	publicationVivoUri = publicationVivoUriTempl
        .replace(/{{extSourceID}}/g, this.key)
        .replace(/{{extSource}}/g, extSource);

	return publicationVivoRDF.replace(/{{publicationVivoUri}}/g, publicationVivoUri);
	
	// var vivoID = 'pubmed_' + this.extSourceID; //wtf?
	
	//temp, check why authorVivoURI
	// var tempAuthorIDs = [this.authorVivoURI];
	
	// for(var i in tempAuthorIDs){//this.authors){
	// 	//find authorVivoURI or create new
	// 	var authorVivoURI = tempAuthorIDs[i];
	// 	authorsVivoRDF += authorsTriple;
	// }
	// publicationVivoRDF = publicationVivoRDF + authorsTriple;
	// publicationVivoRDF = publicationVivoRDF
	// 	.replace(/{{vivoID}}/g, vivoID)
	// 	.replace(/{{authorVivoURI}}/g, authorVivoURI)
	// 	.replace(/{{title}}/g, this.title)
	// 	.replace(/{{pageEnd}}/g, this.pageEnd)
	// 	.replace(/{{volume}}/g, this.bookTitle)
	// 	.replace(/{{relatedBy}}/g, authorsVivoRDF);
};

var getREDISmsetArray = function(){
    var msetArray = [];
    for(var key in this) { 
        if (this.hasOwnProperty(key)) {
            msetArray.push(key);
            msetArray.push(this[key]);
        };
    }
    return msetArray;
    // return [    
    //     "type", this.type,
    //     "key", this.key,
    //     "modificationDate", this.modificationDate,
    //     "title", this.title,
    //     "pageStart", this.pageStart,
    //     "pageEnd", this.pageEnd,
    //     "publicationDate", this.publicationDate,
    //     "bookTitle", this.bookTitle,
    //     "url", this.url,
    //     "ee", this.ee,
    //     "doi", this.doi,

    //     "conference", this.conference,
    //     "journal", this.journal,

    //     "authors", this.authors,
    //     "editors", this.editors
    // ];      
}

var getCreateQuery = function(){
    var tableProperties = [];
    for(var key in this) { 
        if (this.hasOwnProperty(key) && key !== "key") {
            tableProperties.push(key);
        };
    }

    return 'CREATE TABLE IF NOT EXISTS Publications (key TEXT PRIMARY KEY, ' + tableProperties.join(' TEXT, ') + ' TEXT)';  
}

var getInsertQueryValues = function(){
    var tableProperties = [];
    var tableValues = [];
    for(var key in this) { 
        if (this.hasOwnProperty(key)) {
            tableProperties.push(key);
            if (Array.isArray(this[key])) {                
                tableValues.push(this[key].join(','));
            }
            else {
                tableValues.push(this[key] || '');
            }
        };
    }

    // return 'INSERT OR REPLACE INTO Publications (' + tableProperties.join(', ') + ') VALUES(\'' + tableValues.join("', '") +'\')';  
    return {keys: tableProperties, values: tableValues};
}

function Publication(_publication){

	this.key = _publication.key || ""; 
	this.extSourceID = _publication.extSourceID || "";

	this.type = _publication.type || "";
	this.modificationDate = _publication.modificationDate || "";
	this.title = _publication.title || "";
	this.pageStart = _publication.pageStart || "";
	this.pageEnd = _publication.pageEnd || "";
	this.publicationDate = _publication.publicationDate || "";
	this.bookTitle = _publication.booktitle || "";
	this.url = _publication.url || "";
	this.ee = _publication.ee || "";
	this.doi = _publication.doi || "";
	this.issue = _publication.issue || "";
	this.volume = _publication.volume || "";

	this.conference = _publication.conference || "";
	this.journal = _publication.journal || "";

	this.authors = _publication.authors || [];
	this.editors = _publication.editors || [];
}

Publication.prototype.createPublicationRDF = compilePublicationRDF;
Publication.prototype.getREDISmsetArray = getREDISmsetArray;
Publication.prototype.getCreateQuery = getCreateQuery;
Publication.prototype.getInsertQueryValues = getInsertQueryValues;
	
exports.Publication = Publication;
