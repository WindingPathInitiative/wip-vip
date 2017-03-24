'use strict';

const Bookshelf = require( '../helpers/db' ).Bookshelf;

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
}

module.exports = Bookshelf.model( 'MembershipClass', MembershipClassModel );
