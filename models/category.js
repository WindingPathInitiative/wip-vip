'use strict';

const Bookshelf = require( '../helpers/db' ).Bookshelf;

class CategoryModel extends Bookshelf.Model {

	constructor( attributes, options ) {
		super( attributes, options );
		this.hidden = [ 'start', 'end', 'type' ];
	}

	showAll() {
		this.hidden = null;
		return this;
	}

	get tableName() {
		return 'categories';
	}

	awards() {
		return this.hasMany( 'Award', 'category' );
	}
}

module.exports = Bookshelf.model( 'Category', CategoryModel );
