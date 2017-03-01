'use strict';

const Bookshelf = require( '../helpers/db' ).Bookshelf;

class CategoryModel extends Bookshelf.Model {
	get tableName() {
		return 'categories';
	}

	get hidden() {
		return [ 'id', 'start', 'end' ];
	}

	awards() {
		return this.hasMany( 'Award', 'category' );
	}
}

module.exports = Bookshelf.model( 'Category', CategoryModel );
