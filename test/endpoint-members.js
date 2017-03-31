/* eslint-env node, mocha */

const should = require( 'should' ); // eslint-disable-line no-unused-vars

const helpers = require( './helpers' );
const hub = helpers.hub;

const MembersEndpoint = require( '../endpoints/members' );

const errors = require( '../helpers/errors' );

module.exports = function() {
	describe( 'GET /v1/members/{user}/prestige', function() {

		it( 'returns all awards with user me', function( done ) {
			new MembersEndpoint( null, 1 )
			.get( 'me', { status: 'all' }, 'prestige' )
			.then( awards => {
				awards.results.should.be.an.Array();
				awards.results.length.should.be.greaterThan( 0 );
				awards.results.forEach( validateAward );
				done();
			});
		});

		it( 'returns all awards with user set to self', function( done ) {
			new MembersEndpoint( null, 1 )
			.get( 1, { status: 'all' }, 'prestige' )
			.then( awards => {
				awards.results.should.be.an.Array();
				awards.results.length.should.be.greaterThan( 0 );
				awards.results.forEach( validateAward );
				done();
			});
		});

		it( 'returns awards for default status', function( done ) {
			new MembersEndpoint( null, 2 )
			.get( 1, {}, 'prestige' )
			.then( awards => {
				awards.results.should.be.an.Array();
				awards.results.length.should.be.greaterThan( 0 );
				awards.results.forEach( validateAward );
				done();
			});
		});

		it( 'fails if checking all awards without permission', function( done ) {
			new MembersEndpoint( hub( 403 ), 2 )
			.get( 1, { status: 'all' }, 'prestige' )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.AuthError );
				done();
			});
		});

		it( 'fails if checking pending awards without permission', function( done ) {
			new MembersEndpoint( hub( 403 ), 2 )
			.get( 1, { status: 'Requested' }, 'prestige' )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.AuthError );
				done();
			});
		});

		it( 'works if checking awards with permission', function( done ) {
			new MembersEndpoint( hub(), 2 )
			.get( 1, { status: 'all' }, 'prestige' )
			.then( awards => {
				awards.results.should.be.an.Array();
				awards.results.length.should.be.greaterThan( 0 );
				awards.results.forEach( validateAward );
				done();
			});
		});

		it( 'can filter by before date', function( done ) {
			new MembersEndpoint( null, 2 )
			.get( 1, { dateBefore: '2017-02-21' }, 'prestige' )
			.then( awards => {
				awards.results.should.be.an.Array();
				awards.results.length.should.be.greaterThan( 0 );
				awards.results.forEach( validateAward );
				done();
			});
		});

		it( 'can filter by after date', function( done ) {
			new MembersEndpoint( null, 2 )
			.get( 1, { dateAfter: '2017-02-21' }, 'prestige' )
			.then( awards => {
				awards.results.should.be.an.Array();
				awards.results.length.should.be.greaterThan( 0 );
				awards.results.forEach( validateAward );
				done();
			});
		});

		it( 'can limit result size', function( done ) {
			new MembersEndpoint( null, 2 )
			.get( 1, { limit: 1 }, 'prestige' )
			.then( awards => {
				awards.results.should.be.an.Array();
				awards.results.length.should.be.greaterThan( 0 );
				awards.results.forEach( validateAward );
				done();
			});
		});
	});
}

function validateAward( award ) {
	award.should.have.properties([
		'id', 'description', 'source', 'date', 'modified',
		'nominate', 'awarder', 'general', 'regional',
		'national', 'usableGeneral', 'usableRegional', 'usableNational', 'usableVip', 'vip'
	]);
	award.should.have.property( 'category' ).have.properties([
		'name', 'totalLimit', 'entryLimit'
	]);
}
