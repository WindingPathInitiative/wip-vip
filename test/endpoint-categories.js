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

		it( 'throws when specifying an invalid date', function( done ) {
			new CategoryEndpoint().get({ date: 'test' })
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( RequestError );
				done();
			});
		});

		it( 'defaults to all types', function( done ) {
			new CategoryEndpoint().get()
			.then( categories => {
				categories.should.matchAny( c => c.should.have.property( 'type', 'vip' ) );
				categories.should.matchAny( c => c.should.have.property( 'type', 'prestige' ) );
				done();
			});
		});

		it( 'returns prestige when filtered', function( done ) {
			new CategoryEndpoint().get({ type: 'prestige' })
			.then( categories => {
				categories.should.matchEach( c => c.should.have.property( 'type', 'prestige' ) );
				done();
			});
		});

		it( 'returns vip points when filtered', function( done ) {
			new CategoryEndpoint().get({ type: 'vip' })
			.then( categories => {
				categories.should.matchEach( c => c.should.have.property( 'type', 'vip' ) );
				done();
			});
		});

		it( 'returns correct dates when filtered', function( done ) {
			new CategoryEndpoint().get({ date: '2013-06-01' })
			.then( categories => {
				categories.should.matchEach( c => c.should.have.property( 'start' ).containEql( '2013' ) );
				done();
			});
		});

		it( 'returns correct count with limit', function( done ) {
			new CategoryEndpoint().get({ limit: 1 })
			.then( categories => {
				categories.should.be.length( 1 );
				done();
			});
		});

		it( 'returns correct data with offset', function( done ) {
			new CategoryEndpoint().get({ offset: 1 })
			.then( categories => {
				categories[0].should.have.property( 'id', 2 );
				done();
			})
		});

		it( 'returns expected data', function( done ) {
			new CategoryEndpoint().get()
			.then( categories => {
				categories.should.matchEach( category => {
					category.should.have.properties([
						'id', 'name', 'totalLimit', 'entryLimit', 'start', 'end', 'type'
					]);
				});
				done();
			});
		});
	});
}
