'use strict';

const Bookshelf = require( '../helpers/db' ).Bookshelf;

const CategoryModel = require( './category' );
const DocumentModel = require( './document' );

class AwardModel extends Bookshelf.Model {
	get tableName() {
		return 'awards';
	}

	get hidden() {
		return [ 'categoryId', 'documentId', 'mcReviewId' ];
	}

	document() {
		return this.belongsTo( DocumentModel, 'documentId' );
	}

	actions() {
		return this.hasMany( 'Action', 'awardId' );
	}

	mc() {
		return this.belongsTo( 'MembershipClass', 'mc' );
	}

	category() {
		return this.belongsTo( CategoryModel, 'categoryId' );
	}
}

module.exports = Bookshelf.model( 'Award', AwardModel );
