'use strict';

/* eslint-env node, mocha */

const should  = require( 'should' ); // eslint-disable-line no-unused-vars

const hub = require( './helpers' ).hub;
const AwardsEndpoint = require( '../endpoints/awards' );

module.exports = function() {
	it( 'constructs correctly', function() {
		let instance = new AwardsEndpoint( hub(), 1 );
		instance.should.be.an.instanceOf( AwardsEndpoint );
		instance.should.have.properties({
			Hub: hub(),
			userId: 1
		});
	});

	describe( 'GET /v1/awards', function() {
		it( 'returns awards for default status', function( done ) {
			new AwardsEndpoint( null, 1 )
			.get({})
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 3 );
				awards.forEach( validateAward );
				done();
			});
		});

		it( 'fails if checking all awards without permission', function() {
			new AwardsEndpoint( hub( 403 ), 1 )
			.get({ status: 'all' })
			.should.be.rejected();
		});

		it( 'fails if checking pending awards without permission', function() {
			new AwardsEndpoint( hub( 403 ), 1 )
			.get({ status: 'Requested' })
			.should.be.rejected();
		});

		it( 'works if checking awards with permission', function( done ) {
			new AwardsEndpoint( hub(), 1 )
			.get({ status: 'all' })
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 4 );
				awards.forEach( validateAward );
				done();
			});
		});

		it( 'can filter by before date', function( done ) {
			new AwardsEndpoint( null, 2 )
			.get({ dateBefore: '2017-02-21' })
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 1 );
				awards.forEach( validateAward );
				done();
			});
		});

		it( 'can filter by after date', function( done ) {
			new AwardsEndpoint( null, 2 )
			.get({ dateAfter: '2017-02-21' })
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 2 );
				awards.forEach( validateAward );
				done();
			});
		});

		it( 'can limit result size', function( done ) {
			new AwardsEndpoint( null, 2 )
			.get({ limit: 1 } )
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 1 );
				awards.forEach( validateAward );
				done();
			});
		});
	});

	describe( 'GET /v1/awards/member/{user}', function() {

		it( 'returns all awards with user me', function( done ) {
			new AwardsEndpoint( null, 1 )
			.getMember( 'me', { status: 'all' } )
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 3 );
				awards.forEach( validateAward );
				done();
			});
		});

		it( 'returns all awards with user set to self', function( done ) {
			new AwardsEndpoint( null, 1 )
			.getMember( 1, { status: 'all' } )
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 3 );
				awards.forEach( validateAward );
				done();
			});
		});

		it( 'returns awards for default status', function( done ) {
			new AwardsEndpoint( null, 2 )
			.getMember( 1, {} )
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 2 );
				awards.forEach( validateAward );
				done();
			});
		});

		it( 'fails if checking all awards without permission', function() {
			new AwardsEndpoint( hub( 403 ), 2 )
			.getMember( 1, { status: 'all' } )
			.should.be.rejected();
		});

		it( 'fails if checking pending awards without permission', function() {
			new AwardsEndpoint( hub( 403 ), 2 )
			.getMember( 1, { status: 'Requested' } )
			.should.be.rejected();
		});

		it( 'works if checking awards with permission', function( done ) {
			new AwardsEndpoint( hub(), 2 )
			.getMember( 1, { status: 'all' } )
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 3 );
				awards.forEach( validateAward );
				done();
			});
		});

		it( 'can filter by before date', function( done ) {
			new AwardsEndpoint( null, 2 )
			.getMember( 1, { dateBefore: '2017-02-21' } )
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 1 );
				awards.forEach( validateAward );
				done();
			});
		});

		it( 'can filter by after date', function( done ) {
			new AwardsEndpoint( null, 2 )
			.getMember( 1, { dateAfter: '2017-02-21' } )
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 1 );
				awards.forEach( validateAward );
				done();
			});
		});

		it( 'can limit result size', function( done ) {
			new AwardsEndpoint( null, 2 )
			.getMember( 1, { limit: 1 } )
			.then( awards => {
				awards.should.be.an.Array().and.have.length( 1 );
				awards.forEach( validateAward );
				done();
			});
		});
	});
}

function validateAward( award ) {
	award.should.have.properties([
		'id', 'description', 'source', 'date', 'modified',
		'nominate', 'awarder', 'general', 'regional',
		'national', 'usableGeneral', 'usableRegional', 'usableNational', 'vip'
	]);
	award.should.have.property( 'category' ).have.properties([
		'name', 'totalLimit', 'entryLimit'
	]);
}
