'use strict';

/* eslint-env node, mocha */

const should = require( 'should' ); // eslint-disable-line no-unused-vars

const helpers = require( './helpers' );
const hub = helpers.hub;

const MembersEndpoint = require( '../endpoints/members' );

const MembershipClassModel = require( '../models/mc' );
const AwardModel           = require( '../models/award' );

const errors = require( '../helpers/errors' );

module.exports = function() {

	describe( 'GET /v1/members/{user}', function() {

		beforeEach( 'reset data', helpers.resetDB );

		it( 'returns correct membership class', function( done ) {
			new MembersEndpoint( null, 1 )
			.info( 1 )
			.then( data => {
				data.should.have.property( 'membershipClass', 14 );
				done();
			});
		});

		it( 'updates when new membership class approved', function( done ) {
			new MembersEndpoint( null, 1 )
			.info( 2 )
			.then( data => {
				data.should.have.property( 'membershipClass', 1 );
				return new MembershipClassModel({ id: 2 }).fetch()
			})
			.then( mc => mc.save({ status: 'Approved' }) )
			.then( () => new MembersEndpoint( null, 1 ).info( 2 ) )
			.then( data => {
				data.should.have.property( 'membershipClass', 2 );
				done();
			});
		});

		it( 'returns correct prestige', function( done ) {
			new MembersEndpoint( null, 1 )
			.info( 1 )
			.then( data => {
				data.should.have.property( 'prestige' );
				data.prestige.should.have.properties({
					general: 80,
					regional: 0,
					national: 0,
					total: 80
				});
				done();
			});
		});

		it( 'updates when new award is approved', function( done ) {
			new AwardModel({ id: 3 }).fetch()
			.then( award => award.save({ status: 'Awarded' }) )
			.then( () => new MembersEndpoint( null, 1 ).info( 1 ) )
			.then( data => {
				data.prestige.general.should.equal( 80 + 50 );
				data.prestige.total.should.equal( 80 + 50 );
				done();
			});
		});

		it( 'returns correct VIP', function( done ) {
			new MembersEndpoint( null, 1 )
			.info( 1 )
			.then( data => {
				data.should.have.property( 'vip' );
				data.vip.should.have.properties({
					gained: 2,
					spent: 0,
					total: 2
				});
				done();
			});
		});

		it( 'updates when new VIP is approved', function( done ) {
			new AwardModel({ id: 7 }).fetch()
			.then( award => award.save({ status: 'Awarded' }) )
			.then( () => new MembersEndpoint( null, 1 ).info( 1 ) )
			.then( data => {
				data.vip.gained.should.equal( 2 + 2 );
				data.vip.total.should.equal( 2 + 2 );
				done();
			});
		});

		it( 'updates when VIP is spent', function( done ) {
			new AwardModel({ id: 7 }).fetch()
			.then( award => award.save({ status: 'Awarded', usableVip: -2 }) )
			.then( () => new MembersEndpoint( null, 1 ).info( 1 ) )
			.then( data => {
				data.vip.gained.should.equal( 2 );
				data.vip.spent.should.equal( 2 );
				data.vip.total.should.equal( 0 );
				done();
			});
		});

		it( 'returns self on me', function( done ) {
			new MembersEndpoint( null, 1 )
			.info( 'me' )
			.then( data => {
				data.should.have.property( 'membershipClass', 14 );
				done();
			});
		});

		it( 'returns defaults when user does not exist', function( done ) {
			new MembersEndpoint( null, 1 )
			.info( 100 )
			.then( data => {
				data.should.eql({
					prestige: {
						general: 0,
						regional: 0,
						national: 0,
						total: 0
					},
					vip: {
						gained: 0,
						spent: 0,
						total: 0
					},
					membershipClass: 1
				});
				done();
			});
		});
	});

	[ null, 'prestige', 'vip' ].forEach( type => {
		let name = type;
		if ( ! type ) {
			name = 'awards'
		}
		describe( `GET /v1/members/{user}/${name}`, function() {

			it( 'returns all awards with user me', function( done ) {
				new MembersEndpoint( null, 1 )
				.get( 'me', { status: 'all' }, type )
				.then( awards => {
					awards.results.should.be.an.Array();
					awards.results.length.should.be.greaterThan( 0 );
					awards.results.forEach( validateAward );
					done();
				});
			});

			it( 'returns all awards with user set to self', function( done ) {
				new MembersEndpoint( null, 1 )
				.get( 1, { status: 'all' }, type )
				.then( awards => {
					awards.results.should.be.an.Array();
					awards.results.length.should.be.greaterThan( 0 );
					awards.results.forEach( validateAward );
					done();
				});
			});

			it( 'returns awards for default status', function( done ) {
				new MembersEndpoint( null, 2 )
				.get( 1, {}, type )
				.then( awards => {
					awards.results.should.be.an.Array();
					awards.results.length.should.be.greaterThan( 0 );
					awards.results.forEach( validateAward );
					done();
				});
			});

			it( 'fails if checking all awards without permission', function( done ) {
				new MembersEndpoint( hub( 403 ), 2 )
				.get( 1, { status: 'all' }, type )
				.catch( err => {
					err.should.be.an.Error().and.an.instanceOf( errors.AuthError );
					done();
				});
			});

			it( 'fails if checking pending awards without permission', function( done ) {
				new MembersEndpoint( hub( 403 ), 2 )
				.get( 1, { status: 'Requested' }, type )
				.catch( err => {
					err.should.be.an.Error().and.an.instanceOf( errors.AuthError );
					done();
				});
			});

			it( 'works if checking awards with permission', function( done ) {
				new MembersEndpoint( hub(), 2 )
				.get( 1, { status: 'all' }, type )
				.then( awards => {
					awards.results.should.be.an.Array();
					awards.results.length.should.be.greaterThan( 0 );
					awards.results.forEach( validateAward );
					done();
				});
			});

			it( 'can filter by before date', function( done ) {
				new MembersEndpoint( null, 2 )
				.get( 1, { dateBefore: '2017-02-21' }, type )
				.then( awards => {
					awards.results.should.be.an.Array();
					awards.results.length.should.be.greaterThan( 0 );
					awards.results.forEach( validateAward );
					done();
				});
			});

			it( 'can filter by after date', function( done ) {
				new MembersEndpoint( null, 2 )
				.get( 1, { dateAfter: '2017-02-21' }, type )
				.then( awards => {
					awards.results.should.be.an.Array();
					if ( 'prestige' === type ) {
						awards.results.length.should.be.greaterThan( 0 );
					}
					awards.results.forEach( validateAward );
					done();
				});
			});

			it( 'can limit result size', function( done ) {
				new MembersEndpoint( null, 2 )
				.get( 1, { limit: 1 }, type )
				.then( awards => {
					awards.results.should.be.an.Array();
					awards.results.length.should.be.greaterThan( 0 );
					awards.results.forEach( validateAward );
					done();
				});
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
