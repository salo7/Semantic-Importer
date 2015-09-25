var SE = require('../models/simple-entity.js');

function Person(_person){
    SE.SimpleEntity.call(this, _person);
}

Person.prototype = Object.create(SE.SimpleEntity.prototype);
Person.prototype.constructor = Person;


Person.prototype.createQuery = Person.prototype.getCreateQuery('Persons');
	
exports.Person = Person;
