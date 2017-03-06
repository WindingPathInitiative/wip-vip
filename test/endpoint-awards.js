'use strict';

/* eslint-env node, mocha */

const should = require( 'should' ); // eslint-disable-line no-unused-vars
const _      = require( 'lodash' );

const helpers = require( './helpers' );
const resetDB = helpers.resetDB;
const hub = helpers.hub;

const AwardsEndpoint = require( '../endpoints/awards' );

const AwardModel = require( '../models/award' );
const ActionModel = require( '../models/action' );

const errors = require( '../helpers/errors' );

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
				awards.should.be.an.Array().and.have.length( 5 );
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

	describe( 'GET /v1/awards/{id}', function() {

		it( 'throws if award does not exist', function( done ) {
			new AwardsEndpoint( null, 1 )
			.getOne( 100 )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.NotFoundError );
				done();
			});
		});

		it( 'returns an approved award without permission', function( done ) {
			new AwardsEndpoint( null, 2 )
			.getOne( 1 )
			.then( award => {
				validateAward( award );
				done();
			});
		});

		it( 'returns a non-approved award if it\' for the user', function( done ) {
			new AwardsEndpoint( null, 1 )
			.getOne( 3 )
			.then( award => {
				validateAward( award );
				done();
			});
		});

		it( 'throws if non-approved and does not have permission', function( done ) {
			new AwardsEndpoint( hub( 403 ), 2 )
			.getOne( 3 )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.AuthError );
				done();
			});
		});

		it( 'returns a non-approved award and has permission', function( done ) {
			new AwardsEndpoint( hub(), 2 )
			.getOne( 3 )
			.then( award => {
				validateAward( award );
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

		beforeEach( 'reset data', resetDB );

		let data = {
			user: 2,
			category: 1,
			date: '2017-01-01',
			description: 'Test Award'
		};

		Object.keys( data ).forEach( key => {
			it( `fails without providing ${key}`, function( done ) {
				new AwardsEndpoint( null, 1 ).create( _.omit( data, key ) )
				.catch( err => {
					err.should.be.an.Error();
					done();
				});
			});
		});

		Object.keys( data ).forEach( key => {
			if ( 'description' === key ) {
				return;
			}
			it( `fails with malformed ${key}`, function( done ) {
				let badData = _.set( _.clone( data ), key, 'bad!' );
				new AwardsEndpoint( null, 1 ).create( badData )
				.catch( err => {
					err.should.be.an.Error();
					done();
				});
			});
		});

		it( 'fails if negative prestige set without deduct action', function( done ) {
			new AwardsEndpoint( null, 1 ).create( _.assign( {}, data, { general: -10 } ) )
			.catch( err => {
				err.should.be.an.Error();
				done();
			});
		});

		it( 'fails if saving with no prestige', function( done ) {
			new AwardsEndpoint( null, 1 ).create( data )
			.catch( err => {
				err.should.be.an.Error();
				done();
			});
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

	describe( 'PUT /v1/awards/{id}', function() {

		beforeEach( 'reset data', resetDB );

		let data = {
			user: 2,
			category: 1,
			date: '2017-01-01',
			description: 'Test Award'
		};

		Object.keys( data ).forEach( key => {
			it( `fails without providing ${key}`, function( done ) {
				new AwardsEndpoint( null, 1 ).update( 1, _.omit( data, key ) )
				.catch( err => {
					err.should.be.an.Error();
					done();
				});
			});
		});

		Object.keys( data ).forEach( key => {
			if ( 'description' === key ) {
				return;
			}
			it( `fails with malformed ${key}`, function( done ) {
				let badData = _.set( _.clone( data ), key, 'bad!' );
				new AwardsEndpoint( null, 1 ).update( 1, badData )
				.catch( err => {
					err.should.be.an.Error();
					done();
				});
			});
		});

		it( 'fails if negative prestige set without deduct action', function( done ) {
			new AwardsEndpoint( null, 1 ).update( 1, _.assign( {}, data, { general: -10 } ) )
			.catch( err => {
				err.should.be.an.Error();
				done();
			});
		});

		it( 'fails if saving with no prestige', function( done ) {
			new AwardsEndpoint( null, 1 ).update( 1, data )
			.catch( err => {
				err.should.be.an.Error();
				done();
			});
		});

		it( 'fails if trying to modify own approved award', function( done ) {
			let newData = Object.assign( {}, data, { general: 10 } );
			new AwardsEndpoint( null, 2 ).update( 1, newData )
			.catch( err => {
				err.should.be.an.Error();
				done();
			});
		});

		it( 'works if trying to modify requested award', function( done ) {
			let newData = Object.assign( {}, data, { general: 10 } );
			new AwardsEndpoint( null, 2 ).update( 3, newData )
			.then( award => {
				award.toJSON().should.have.properties({
					user: 2,
					status: 'Requested',
					general: 10,
					usableGeneral: 10
				});
				done();
			});
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
				new AwardsEndpoint( newHub, 1 ).update( 1, newData )
				.then( award => {
					validateAward( award.toJSON() );
					done();
				});
			});

			it( `verifies correct role for ${level} awards`, function( done ) {
				let newData = Object.assign( {}, data, { action: 'award' } );
				newData[ level ] = 10;
				newHub.action = newData.action;
				new AwardsEndpoint( newHub, 1 ).update( 1, newData )
				.then( award => {
					validateAward( award.toJSON() );
					done();
				});
			});

			it( `verifies correct role for ${level} deducts`, function( done ) {
				let newData = Object.assign( {}, data, { action: 'deduct' } );
				newData[ level ] = -10;
				newHub.action = newData.action;
				new AwardsEndpoint( newHub, 1 ).update( 1, newData )
				.then( award => {
					validateAward( award.toJSON() );
					done();
				});
			});
		});

		it( 'sets the correct status for nominations', function( done ) {
			let newData = Object.assign( {}, data, { general: 10 } );
			new AwardsEndpoint( hub(), 1 ).update( 1, newData )
			.then( award => {
				award = award.toJSON();
				award.should.have.property( 'status', 'Nominated' );
				award.should.have.property( 'nominate', 1 );
				done();
			});
		});

		it( 'sets the correct status for awards', function( done ) {
			let newData = Object.assign( {}, data, { action: 'award', general: 10 } );
			new AwardsEndpoint( hub(), 1 ).update( 1, newData )
			.then( award => {
				award = award.toJSON();
				award.should.have.property( 'status', 'Awarded' );
				award.should.have.property( 'awarder', 1 );
				done();
			});
		});

		it( 'sets the correct status for reductions', function( done ) {
			let newData = Object.assign( {}, data, { action: 'deduct', general: -10 } );
			new AwardsEndpoint( hub(), 1 ).update( 1, newData )
			.then( award => {
				award = award.toJSON();
				award.should.have.property( 'status', 'Awarded' );
				award.should.have.property( 'awarder', 1 );
				done();
			});
		});

		it( 'returns the correct data', function( done ) {
			let newData = Object.assign( {}, data, { general: 10 } );
			new AwardsEndpoint( hub(), 1 ).update( 1, newData )
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

		it( 'does create an action on nomination', function( done ) {
			let newData = Object.assign( {}, data, { general: 10 } );
			new AwardsEndpoint( hub(), 1 ).update( 1, newData )
			.then( award => new ActionModel().where({ awardId: award.get( 'id' ) }).fetchAll() )
			.then( actions => {
				actions.should.have.length( 2 );
				let action = actions.at( 1 ).toJSON();
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
			new AwardsEndpoint( hub(), 1 ).update( 3, newData )
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

		it( 'updates related MC reviews' );
	});

	describe( 'DELETE /v1/awards/{id}', function() {
		beforeEach( 'reset data', resetDB );

		it( 'throws when removing a non-existent award', function( done ) {
			new AwardsEndpoint( null, 1 ).delete( 999 )
			.catch( err => {
				err.should.be.an.Error();
				done();
			});
		});

		it( 'throws when removing an already removed award', function( done ) {
			new AwardsEndpoint( null, 1 ).delete( 5 )
			.catch( err => {
				err.should.be.an.Error();
				done();
			});
		});

		it( 'throws when removing with no offices', function( done ) {
			new AwardsEndpoint( hub( 200, [] ), 3 ).delete( 1 )
			.catch( err => {
				err.should.be.an.Error();
				done();
			});
		});

		it( 'throws when removing without permission', function( done ) {

			let hub = helpers.seriesHub([{ body: [{ id: 2 }] }, { statusCode: 403 }]);

			new AwardsEndpoint( hub, 3 ).delete( 1 )
			.catch( err => {
				err.should.be.an.Error();
				done();
			});
		});

		it( 'works if requested by self', function( done ) {
			new AwardsEndpoint( null, 1 ).delete( 3 )
			.then( award => {
				award.toJSON().should.have.property( 'status', 'Denied' );
				done();
			});
		});

		it( 'works if officer nominated and award still nominated', function( done ) {
			new AwardModel({
				id: 10,
				user: 1,
				categoryId: 1,
				date: new Date( '2017-02-20' ),
				status: 'Nominated',
				nominate: 2
			}).save( {}, { method: 'insert' } )
			.then( () => {
				new AwardsEndpoint( hub( 200, [{ id: 2 }] ), 3 ).delete( 10 )
				.then( award => {
					award.toJSON().should.have.property( 'status', 'Denied' );
					done();
				});
			});
		});

		it( 'works if officer awarded', function( done ) {
			new AwardModel({
				id: 10,
				user: 1,
				categoryId: 1,
				date: new Date( '2017-02-20' ),
				status: 'Awarded',
				awarder: 2
			}).save( {}, { method: 'insert' } )
			.then( () => {
				new AwardsEndpoint( hub( 200, [{ id: 2 }] ), 3 ).delete( 10 )
				.then( award => {
					award.toJSON().should.have.property( 'status', 'Denied' );
					done();
				});
			});
		});

		it( 'works if have correct role', function( done ) {
			let hub = helpers.seriesHub(
				[{ body: [{ id: 2 }] },
				{ statusCode: 200 }]
			);
			new AwardsEndpoint( hub, 2 ).delete( 1 )
			.then( award => {
				award.toJSON().should.have.property( 'status', 'Denied' );
				done();
			});
		});

		it( 'updates DB to correct status', function( done ) {
			new AwardsEndpoint( null, 1 ).delete( 3 )
			.then( () => new AwardModel({ id: 3 }).fetch() )
			.then( award => {
				award.toJSON().should.have.property( 'status', 'Denied' );
				done();
			});
		});

		it( 'creates an action entry', function( done ) {
			let hub = helpers.seriesHub(
				[{ body: [{ id: 2 }] },
				{ statusCode: 200, body: { offices: [{ id: 1 }] } }]
			);
			new AwardsEndpoint( hub, 2 ).delete( 1, 'Test note' )
			.then( () => new ActionModel().where({ action: 'Revoked' }).fetch() )
			.then( action => {
				action.toJSON().should.have.properties({
					awardId: 1,
					office: 1,
					user: 2,
					action: 'Revoked',
					note: 'Test note'
				});
				done();
			});
		})

		it( 'updates related MC reviews' );
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
