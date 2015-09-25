
function SimpleEntity(_person){

	this.name = _person.name || ""; 
	this.id = _person.id || "";
}

var getCreateQuery = function(table){
    return 'CREATE TABLE IF NOT EXISTS '+ table + ' (id TEXT PRIMARY KEY, name TEXT)';  
}

SimpleEntity.prototype.getCreateQuery = getCreateQuery;
	
exports.SimpleEntity = SimpleEntity;