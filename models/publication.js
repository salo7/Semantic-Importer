var uuid = require('node-uuid');


var createPublicationRDF = function(authorVivoID){
	var publicationVivoRDF = '';
	var authorsVivoRDF = ''; 
	var vivoPublicationItemTemplate = '<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> rdf:type owl:Thing .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> rdf:type bibo:Document .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> rdf:type obo:BFO_0000001 .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> rdf:type bibo:AcademicArticle .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> rdf:type obo:BFO_0000002 .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> rdf:type bibo:Article .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> rdf:type obo:IAO_0000030 .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> rdf:type obo:BFO_0000031 .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> vitro:mostSpecificType bibo:AcademicArticle .\n'+
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> rdfs:label "{{title}}" .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> bibo:pageEnd "{{pageEnd}}" .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> bibo:pageStart "{{pageStart}}" .\n'+ 
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> bibo:volume "{{volume}}" .\n'+
	'<http://vivo.iai.uni-bonn.de/vivo/individual/{{authorVivoID}}> vivo:Authorship <http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> .\n' 
	
	var authorsTriple = '<http://vivo.iai.uni-bonn.de/vivo/individual/{{vivoID}}> vivoCore:relatedBy <http://vivo.iai.uni-bonn.de/vivo/individual/{{authorVivoID}}> .\n';
	
	var vivoID = 'pubmed_' + this.extSourceID; //wtf?
	
	//temp, check why authorVivoID
	// var tempAuthorIDs = [this.authorVivoID];
	
	// for(var i in tempAuthorIDs){//this.authors){
	// 	//find authorVivoID or create new
	// 	var authorVivoID = tempAuthorIDs[i];
	// 	authorsVivoRDF += authorsTriple;
	// }
	publicationVivoRDF = vivoPublicationItemTemplate + authorsTriple;
	publicationVivoRDF = publicationVivoRDF
		.replace(/{{vivoID}}/g, vivoID)
		.replace(/{{authorVivoID}}/g, authorVivoID)
		.replace(/{{title}}/g, this.title)
		.replace(/{{pageEnd}}/g, this.pageEnd)
		.replace(/{{volume}}/g, this.bookTitle)
		.replace(/{{relatedBy}}/g, authorsVivoRDF);
	
	return publicationVivoRDF;
};

var getREDISmsetArray = function(){
	return [	
		"type", this.type,
		"key", this.key,
		"modificationDate", this.modificationDate,
		"title", this.title,
		"pageStart", this.pageStart,
		"pageEnd", this.pageEnd,
		"publicationDate", this.publicationDate,
		"bookTitle", this.bookTitle,
		"url", this.url,
		"ee", this.ee,
		"doi", this.doi,

		"conference", this.conference,
		"journal", this.journal,

		"authors", this.authors,
		"editors", this.editors
	];		
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

	this.authors = _publication.authors || "";
	this.editors = _publication.editors || "";
}

Publication.prototype.createPublicationRDF = createPublicationRDF;
Publication.prototype.getREDISmsetArray = getREDISmsetArray;
	
exports.Publication = Publication;
