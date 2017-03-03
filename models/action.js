'use strict';

const Bookshelf = require( '../helpers/db' ).Bookshelf;

class ActionModel extends Bookshelf.Model {
	get tableName() {
		return 'actions';
	}

	award() {
		return this.belongsTo( 'Award', 'awardId' );
	}

	mc() {
		return this.belongsTo( 'MC', 'mcId' );
	}
}

module.exports = Bookshelf.model( 'Action', ActionModel );
