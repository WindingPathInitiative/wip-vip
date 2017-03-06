'use strict';

/* eslint-env node, mocha */

const should = require( 'should' ); // eslint-disable-line no-unused-vars

const CategoryEndpoint = require( '../endpoints/categories' );

const RequestError = require( '../helpers/errors' ).RequestError;

module.exports = function() {
	it( 'constructs correctly', function() {
		let instance = new CategoryEndpoint();
		instance.should.be.an.instanceOf( CategoryEndpoint );
	});

	describe( 'GET /v1/categories', function() {

		it( 'throws when requesting invalid type', function( done ) {
			new CategoryEndpoint().get({ type: 'test' })
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( RequestError );
				done();
			});
		});

		it( 'throws when specifying an invalid date' );

		it( 'defaults to all types' );

		it( 'returns prestige when filtered' );

		it( 'returns vip points when filtered' );

		it( 'returns correct dates when filtered' );

		it( 'returns correct count with limit' );

		it( 'returns correct date with offset' );

		it( 'returns expected data' );
	});
}
