function createPublicationRDF(publication){
	var publicationVivoRDF = '';
	var authorsVivoRDF = ''; 
	var vivoPublicationItemTemplate = 'vivoIndividual:{{vivoID}} rdf:type owl:Thing .\n'+ 
	'vivoIndividual:{{vivoID}} rdf:type bibo:Document .\n'+ 
	'vivoIndividual:{{vivoID}} rdf:type obo:BFO_0000001 .\n'+ 
	'vivoIndividual:{{vivoID}} rdf:type bibo:AcademicArticle .\n'+ 
	'vivoIndividual:{{vivoID}} rdf:type obo:BFO_0000002 .\n'+ 
	'vivoIndividual:{{vivoID}} rdf:type bibo:Article .\n'+ 
	'vivoIndividual:{{vivoID}} rdf:type obo:IAO_0000030 .\n'+ 
	'vivoIndividual:{{vivoID}} rdf:type obo:BFO_0000031 .\n'+ 
	'vivoIndividual:{{vivoID}} vitro:mostSpecificType bibo:AcademicArticle .\n'+
	'vivoIndividual:{{vivoID}} <http://www.w3.org/2000/01/rdf-schema#label> "{{title}}" .\n'+ 
	'vivoIndividual:{{vivoID}} bibo:pageEnd "{{pageEnd}}" .\n'+ 
	'vivoIndividual:{{vivoID}} bibo:pageStart "{{pageStart}}" .\n'+ 
	'vivoIndividual:{{vivoID}} bibo:volume "{{volume}}" .\n'+
	'vivoIndividual:{{authorVivoID}} vivo:Authorship vivoIndividual:{{vivoID}} .\n' 
	
	var authorsTriple = 'vivoIndividual:{{vivoID}} vivoCore:relatedBy vivoIndividual:{{authorVivoID}} .\n';
	
	var vivoID = 'n' + '_pubmed_' + publication.pubmedID;
	
	//temp
	var tempAuthorIDs = [publication.authorVivoID];
	
	for(var i in tempAuthorIDs){//publication.authors){
		//find authorVivoID or create new
		var authorVivoID = tempAuthorIDs[i];
		authorsVivoRDF += authorsTriple;
	}
	publicationVivoRDF = vivoPublicationItemTemplate + authorsVivoRDF;
	publicationVivoRDF = publicationVivoRDF
		.replace(/{{vivoID}}/g, vivoID)
		.replace(/{{authorVivoID}}/g, authorVivoID)
		.replace(/{{title}}/g, publication.title)
		.replace(/{{pageEnd}}/g, publication.pages)
		.replace(/{{volume}}/g, publication.bookTitle)
		.replace(/{{relatedBy}}/g, authorsVivoRDF);
	
	return publicationVivoRDF;
};

function Publication(authorVivoID, pubmedID, type, key, mdate, authors, title, pages, year, booktitle, url, ee){
	var publication = {};
	publication.authorVivoID = authorVivoID;
	publication.pubmedID = pubmedID;
	publication.type = type;
	publication.key = key;
	publication.mdate = mdate;
	publication.authors = authors;
	publication.title = title;
	publication.pages = pages;
	publication.year = year;
	publication.bookTitle = booktitle;
	publication.url = url;
	publication.ee = ee;

	return publication;
}

	
exports.Publication = Publication;
exports.createPublicationRDF = createPublicationRDF;
