'use strict';

const config = require( '../knexfile' );

let env = process.env.NODE_ENV || 'development';

const knex = require( 'knex' )( config[ env ] );
module.exports = knex;

const Bookshelf = require( 'bookshelf' )( knex );

Bookshelf.plugin( 'registry' );
Bookshelf.plugin( 'pagination' );
Bookshelf.plugin( 'visibility' );

Bookshelf.plugin( require( 'bookshelf-json-columns' ) );

module.exports.Bookshelf = Bookshelf;
