'use strict';

const Bookshelf = require( '../helpers/db' ).Bookshelf;

class DocumentModel extends Bookshelf.Model {
	get tableName() {
		return 'documents';
	}

	award() {
		return this.hasMany( 'Award', 'documentId' );
	}

	category() {
		return this.belongsTo( 'DocumentCategory', 'categoryId' );
	}
}

module.exports = Bookshelf.model( 'Document', DocumentModel );
