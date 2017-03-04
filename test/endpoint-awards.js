'use strict';

/* eslint-env node, mocha */

const should = require( 'should' ); // eslint-disable-line no-unused-vars
const _      = require( 'lodash' );

const hub = require( './helpers' ).hub;
const AwardsEndpoint = require( '../endpoints/awards' );
const ActionModel = require( '../models/action' );

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

	describe( 'POST /v1/awards', function() {

		beforeEach( 'reset data', function( done ) {
			let knex = require( '../helpers/db' );
			knex.seed.run().then( () => done() );
		});

		let data = {
			user: 2,
			category: 1,
			date: '2017-01-01',
			description: 'Test Award'
		};

		Object.keys( data ).forEach( key => {
			it( `fails without providing ${key}`, function() {
				new AwardsEndpoint( null, 1 ).create( _.omit( data, key ) )
				.should.be.rejectedWith({ status: 400 });
			});
		});

		Object.keys( data ).forEach( key => {
			if ( 'description' === key ) {
				return;
			}
			it( `fails with malformed ${key}`, function() {
				let badData = _.set( _.clone( data ), key, 'bad!' );
				new AwardsEndpoint( null, 1 ).create( badData )
				.should.be.rejectedWith({ status: 400 });
			});
		});

		it( 'fails if negative prestige set without deduct action', function() {
			new AwardsEndpoint( null, 1 ).create( _.assign( {}, data, { general: -10 } ) )
			.should.be.rejectedWith({ status: 400 });
		});

		it( 'fails if saving with no prestige', function() {
			new AwardsEndpoint( null, 1 ).create( data )
			.should.be.rejectedWith({ status: 400, message: 'No prestige awarded' });
		});

		it( 'sets action to request for self', function( done ) {
			let newData = Object.assign( {}, data, { user: 'me', general: 10 } );
			new AwardsEndpoint( null, 1 ).create( newData )
			.then( award => {
				award = award.toJSON();
				award.should.have.property( 'status', 'Requested' );
				done();
			});
		});

		it( 'sets the user ID for requesting self', function( done ) {
			let newData = Object.assign( {}, data, { user: 'me', general: 10 } );
			new AwardsEndpoint( null, 1 ).create( newData )
			.then( award => {
				award = award.toJSON();
				award.should.have.property( 'user', 1 );
				done();
			});
		});

		it( 'does not check permission for self', function() {
			let newData = Object.assign( {}, data, { general: 10 } );
			new AwardsEndpoint( null, 2 ).create( newData )
			.should.be.a.Promise();
		});

		let levels = [ 'general', 'regional', 'national' ];
		levels.forEach( level => {
			let newHub = hub();
			newHub.hasOverUser = ( user, roles ) => {
				roles.should.containEql( level ).and.containEql( newHub.action );
				return Promise.resolve( true );
			};

			it( `verifies correct role for ${level} nominations`, function( done ) {
				let newData = Object.assign( {}, data );
				newData[ level ] = 10;
				newHub.action = 'nominate';
				new AwardsEndpoint( newHub, 1 ).create( newData )
				.then( award => {
					validateAward( award.toJSON() );
					done();
				});
			});

			it( `verifies correct role for ${level} awards`, function( done ) {
				let newData = Object.assign( {}, data, { action: 'award' } );
				newData[ level ] = 10;
				newHub.action = newData.action;
				new AwardsEndpoint( newHub, 1 ).create( newData )
				.then( award => {
					validateAward( award.toJSON() );
					done();
				});
			});

			it( `verifies correct role for ${level} deducts`, function( done ) {
				let newData = Object.assign( {}, data, { action: 'deduct' } );
				newData[ level ] = -10;
				newHub.action = newData.action;
				new AwardsEndpoint( newHub, 1 ).create( newData )
				.then( award => {
					validateAward( award.toJSON() );
					done();
				});
			});
		});

		it( 'sets the correct status for nominations', function( done ) {
			let newData = Object.assign( {}, data, { general: 10 } );
			new AwardsEndpoint( hub(), 1 ).create( newData )
			.then( award => {
				award = award.toJSON();
				award.should.have.property( 'status', 'Nominated' );
				award.should.have.property( 'nominate', 1 );
				done();
			});
		});

		it( 'sets the correct status for awards', function( done ) {
			let newData = Object.assign( {}, data, { action: 'award', general: 10 } );
			new AwardsEndpoint( hub(), 1 ).create( newData )
			.then( award => {
				award = award.toJSON();
				award.should.have.property( 'status', 'Awarded' );
				award.should.have.property( 'awarder', 1 );
				done();
			});
		});

		it( 'sets the correct status for reductions', function( done ) {
			let newData = Object.assign( {}, data, { action: 'deduct', general: -10 } );
			new AwardsEndpoint( hub(), 1 ).create( newData )
			.then( award => {
				award = award.toJSON();
				award.should.have.property( 'status', 'Awarded' );
				award.should.have.property( 'awarder', 1 );
				done();
			});
		});

		it( 'returns the correct data', function( done ) {
			let newData = Object.assign( {}, data, { general: 10 } );
			new AwardsEndpoint( hub(), 1 ).create( newData )
			.then( award => {
				award = award.toJSON();
				validateAward( award );
				let testObj = _.merge( newData, {
					status: 'Nominated',
					nominate: 1
				} );
				delete testObj.category;
				award.should.have.properties( testObj );
				done();
			});
		});

		it( 'does not create an action on request', function( done ) {
			let newData = Object.assign( {}, data, { general: 10 } );
			new AwardsEndpoint( hub(), 2 ).create( newData )
			.then( award => new ActionModel().where({ awardId: award.get( 'id' ) }).fetchAll() )
			.then( actions => {
				actions.should.have.length( 0 );
				done();
			});
		});

		it( 'does create an action on nomination', function( done ) {
			let newData = Object.assign( {}, data, { general: 10 } );
			new AwardsEndpoint( hub(), 1 ).create( newData )
			.then( award => new ActionModel().where({ awardId: award.get( 'id' ) }).fetchAll() )
			.then( actions => {
				actions.should.have.length( 1 );
				let action = actions.at( 0 ).toJSON();
				action.should.have.properties({
					action: 'Nominated',
					user: 1,
					office: 1
				});
				done();
			});
		});

		it( 'does create an action on awarding', function( done ) {
			let newData = Object.assign( {}, data, { general: 10, action: 'award' } );
			new AwardsEndpoint( hub(), 1 ).create( newData )
			.then( award => new ActionModel().where({ awardId: award.get( 'id' ) }).fetchAll() )
			.then( actions => {
				actions.should.have.length( 1 );
				let action = actions.at( 0 ).toJSON();
				action.should.have.properties({
					action: 'Awarded',
					user: 1,
					office: 1
				});
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
