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

	whereVip() {
		return this.where( 'usableVip', '<>', 0 );
	}

	wherePrestige() {
		return this.where( 'usableVip', 0 );
	}

	static getUserTotals( user ) {
		return new AwardModel().where({ user: user, status: 'Awarded' }).wherePrestige()
		.fetchAll()
		.then( awards => {
			let start = { general: 0, regional: 0, national: 0, total: 0 };
			if ( null === awards ) {
				return start;
			}
			return awards.toJSON().reduce(
				( acc, val ) => {
					acc.general += val.usableGeneral;
					acc.regional += val.usableRegional;
					acc.national += val.usableNational;
					acc.total += ( val.usableGeneral + val.usableRegional + val.usableNational );
					return acc;
				}, start
			);
		});
	}

	static getUserVip( user ) {
		return new AwardModel().where({ user: user, status: 'Awarded' }).whereVip()
		.fetchAll()
		.then( awards => {
			let start = { gained: 0, spent: 0, total: 0 };
			if ( null === awards ) {
				return start;
			}
			return awards.toJSON().reduce(
				( acc, val ) => {
					if ( val.usableVip > 0 ) {
						acc.gained += val.usableVip;
					} else {
						acc.spent += Math.abs( val.usableVip );
					}
					acc.total += val.usableVip;
					return acc;
				}, start
			);
		});
	}
}

module.exports = Bookshelf.model( 'Award', AwardModel );
