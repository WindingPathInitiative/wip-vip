'use strict';

const Bookshelf = require( '../helpers/db' ).Bookshelf;

const AwardModel = require( './award' );

class MembershipClassModel extends Bookshelf.Model {
	get tableName() {
		return 'mc';
	}

	awards() {
		return this.hasMany( 'Award', 'mcReviewId' );
	}

	restrict() {
		this.hidden = [ 'general', 'regional', 'national', 'currentLevel', 'office' ];
		return this;
	}

	reset( levels ) {
		let levelData = levels[ this.get( 'level' ) ];
		if ( ! levelData ) {
			return this.save( 'status', 'Removed' );
		}

		return AwardModel.getUserTotals( this.get( 'user' ) )
		.then( totals => {
			this.set({
				general:  totals.general,
				regional: totals.regional,
				national: totals.national
			});

			if (
				levelData.national > totals.national ||
				levelData.regional > ( totals.regional + totals.national ) ||
				levelData.general > totals.total
			) {
				this.set( 'status', 'Removed' );
			} else {
				this.set({
					status: 'Requested',
					currentLevel: 'Domain'
				});
			}

			return this.save();
		});
	}
}

module.exports = Bookshelf.model( 'MembershipClass', MembershipClassModel );
