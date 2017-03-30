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

	review() {
		return this.belongsTo( 'MembershipClass', 'mcReviewId' );
	}

	category() {
		return this.belongsTo( CategoryModel, 'categoryId' );
	}

	static getUserTotals( user ) {
		return new AwardModel().where({ user: user, status: 'Awarded' })
		.fetchAll()
		.then( awards => {
			return awards.toJSON().reduce(
				( acc, val ) => {
					acc.general += val.usableGeneral;
					acc.regional += val.usableRegional;
					acc.national += val.usableNational;
					acc.total += ( val.usableGeneral + val.usableRegional + val.usableNational );
					return acc;
				},
				{ general: 0, regional: 0, national: 0, total: 0 }
			);
		});
	}
}

module.exports = Bookshelf.model( 'Award', AwardModel );
