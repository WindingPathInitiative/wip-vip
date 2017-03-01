'use strict';

const Bookshelf = require( '../helpers/db' ).Bookshelf;

const Category = require( './category' );

class AwardModel extends Bookshelf.Model {
	get tableName() {
		return 'awards';
	}

	get hidden() {
		return [ 'categoryId', 'documentId', 'mcReviewId' ];
	}

	document() {
		return this.belongsTo( 'Document', 'documentId' );
	}

	actions() {
		return this.hasMany( 'Action', 'awardId' );
	}

	mc() {
		return this.belongsTo( 'MC', 'mc' );
	}

	category() {
		return this.belongsTo( Category, 'categoryId' );
	}
}

module.exports = Bookshelf.model( 'Award', AwardModel );
