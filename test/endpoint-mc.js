'use strict';

/* eslint-env node, mocha */

const should = require( 'should' ); // eslint-disable-line no-unused-vars

const helpers = require( './helpers' );
const resetDB = helpers.resetDB;
const hub     = helpers.hub;

const MembershipClassEndpoint = require( '../endpoints/mc' );

const MembershipClassModel = require( '../models/mc' );
const ActionModel          = require( '../models/action' );

const errors = require( '../helpers/errors' );

module.exports = function() {
	it( 'constructs correctly', function() {
		let instance = new MembershipClassEndpoint( hub(), 1 );
		instance.should.be.an.instanceOf( MembershipClassEndpoint );
		instance.should.have.properties({
			Hub: hub(),
			userId: 1
		});
	});

	describe( 'GET /v1/mc', function() {
		it( 'returns classes for default status', function( done ) {
			new MembershipClassEndpoint( null, 1 )
			.get({})
			.then( classes => {
				classes.should.be.an.Array();
				classes.length.should.be.aboveOrEqual( 1 );
				classes.forEach( validateBulkClass );
				done();
			});
		});

		it( 'fails if checking all classes without permission', function( done ) {
			new MembershipClassEndpoint( hub( 403 ), 1 )
			.get({ status: 'all' })
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.AuthError );
				done();
			});
		});

		it( 'fails if checking pending classes without permission', function( done ) {
			new MembershipClassEndpoint( hub( 403 ), 1 )
			.get({ status: 'Requested' })
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.AuthError );
				done();
			});
		});

		it( 'works if checking classes with permission', function( done ) {
			new MembershipClassEndpoint( hub(), 1 )
			.get({ status: 'all' })
			.then( classes => {
				classes.should.be.an.Array();
				classes.length.should.be.aboveOrEqual( 1 );
				classes.forEach( validateBulkClass );
				done();
			});
		});

		it( 'can filter by before date', function( done ) {
			new MembershipClassEndpoint( null, 2 )
			.get({ dateBefore: '2017-02-21' })
			.then( classes => {
				classes.should.be.an.Array();
				classes.length.should.be.aboveOrEqual( 1 );
				classes.forEach( validateBulkClass );
				done();
			});
		});

		it( 'can filter by after date', function( done ) {
			new MembershipClassEndpoint( null, 2 )
			.get({ dateAfter: '2017-02-21' })
			.then( classes => {
				classes.should.be.an.Array();
				classes.length.should.be.equal( 0 );
				classes.forEach( validateBulkClass );
				done();
			});
		});

		it( 'can limit result size', function( done ) {
			new MembershipClassEndpoint( null, 2 )
			.get({ limit: 1 } )
			.then( classes => {
				classes.should.be.an.Array();
				classes.length.should.be.equal( 1 );
				classes.forEach( validateBulkClass );
				done();
			});
		});

		it( 'checks the correct roles', function( done ) {
			let roles = [ 'mc_request', 'mc_approve', 'mc_revoke' ]
			new MembershipClassEndpoint( helpers.roleHub( null, null, roles ), 1 )
			.get({ status: 'all' })
			.then( () => done() );
		});
	});

	describe( 'GET /v1/mc/{id}', function() {

		it( 'throws if award does not exist', function( done ) {
			new MembershipClassEndpoint( null, 1 )
			.getOne( 100 )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.NotFoundError );
				done();
			});
		});

		it( 'returns an approved award without permission', function( done ) {
			new MembershipClassEndpoint( null, 2 )
			.getOne( 1 )
			.then( award => {
				validateClass( award );
				done();
			});
		});

		it( 'returns a non-approved award if it\' for the user', function( done ) {
			new MembershipClassEndpoint( null, 2 )
			.getOne( 2 )
			.then( award => {
				validateClass( award );
				done();
			});
		});

		it( 'throws if non-approved and does not have permission', function( done ) {
			new MembershipClassEndpoint( hub( 403 ), 1 )
			.getOne( 2 )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.AuthError );
				done();
			});
		});

		it( 'returns a non-approved award and has permission', function( done ) {
			new MembershipClassEndpoint( hub(), 2 )
			.getOne( 2 )
			.then( award => {
				validateClass( award );
				done();
			});
		});

		it( 'checks the correct roles', function( done ) {
			let roles = [ 'mc_request', 'mc_approve', 'mc_revoke' ]
			new MembershipClassEndpoint( helpers.roleHub( null, null, roles ), 1 )
			.getOne( 2 )
			.then( () => done() );
		});
	});

	describe( 'POST /v1/mc', function() {
		let levels = {
			'3': { general: 10, regional: 0, national: 0 },
			'4': { general: 1000, regional: 0, national: 0 }
		};

		beforeEach( 'reset data', resetDB );

		it( 'throws if requesting MC 1', function( done ) {
			new MembershipClassEndpoint( null, 1, levels )
			.create( 1, 1 )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.RequestError );
				done();
			});
		});

		it( 'throws if requesting invalid level', function( done ) {
			new MembershipClassEndpoint( null, 1, levels )
			.create( 1, 'invalid' )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.RequestError );
				done();
			});
		});

		it( 'throws if requesting already requested level', function( done ) {
			new MembershipClassEndpoint( null, 2, levels )
			.create( 2, 2 )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.RequestError );
				done();
			});
		});

		it( 'throws if requesting already below existing level', function( done ) {
			new MembershipClassEndpoint( null, 1, levels )
			.create( 1, 3 )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.RequestError );
				done();
			});
		});

		it( 'throws if without permission', function( done ) {
			new MembershipClassEndpoint( hub( 403 ), 1, levels )
			.create( 2, 3 )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.AuthError );
				done();
			});
		});

		it( 'throws if requesting without needed prestige', function( done ) {
			new MembershipClassEndpoint( null, 2, levels )
			.create( 2, 4 )
			.catch( err => {
				err.should.be.an.Error().and.an.instanceOf( errors.RequestError );
				done();
			});
		});

		it( 'works if requesting for self', function( done ) {
			new MembershipClassEndpoint( null, 2, levels )
			.create( 2, 3 )
			.then( cls => {
				validateClass( cls );
				done();
			});
		});

		it( 'checks roles for requesting for other', function( done ) {
			new MembershipClassEndpoint( helpers.roleHub( null, null, 'mc_request' ), 1, levels )
			.create( 2, 3 )
			.then( () => done() );
		});

		it( 'works for requesting for other', function( done ) {
			new MembershipClassEndpoint( hub(), 1, levels )
			.create( 2, 3 )
			.then( cls => {
				validateClass( cls );
				done();
			});
		});

		it( 'creates row in database', function( done ) {
			new MembershipClassEndpoint( hub(), 1, levels )
			.create( 2, 3 )
			.then( cls => new MembershipClassModel({ id: cls.id }).fetch() )
			.then( cls => {
				cls.should.not.be.null();
				validateBulkClass( cls.toJSON() );
				done();
			});
		});

		it( 'creates action in database', function( done ) {
			new MembershipClassEndpoint( hub(), 1, levels )
			.create( 2, 3 )
			.then( cls => new ActionModel().where({ mcId: cls.id }).fetchAll() )
			.then( actions => {
				actions.toJSON().should.have.length( 1 );
				let action = actions.at( 0 ).toJSON();
				action.should.have.properties({
					action: 'Nominated',
					user: 1,
					office: 1
				});
				done();
			});
		});

		it( 'does not create action in database when requesting self', function( done ) {
			new MembershipClassEndpoint( null, 2, levels )
			.create( 2, 3 )
			.then( cls => new ActionModel().where({ mcId: cls.id }).fetchAll() )
			.then( actions => {
				actions.toJSON().should.have.length( 0 );
				done();
			});
		});
	});

	describe( 'GET /v1/mc/levels', function() {
		it( 'returns provided levels', function() {
			let levels = require( '../membership-classes' );
			new MembershipClassEndpoint( null, 1, levels )
			.getLevels().should.equal( levels );
		});
	});
}

function validateBulkClass( cls ) {
	cls.should.have.properties([
		'id', 'user', 'date', 'level', 'status'
	]);
}

function validateClass( cls ) {
	validateBulkClass( cls );
	cls.should.have.properties([ 'general', 'regional', 'national', 'currentLevel', 'office' ]);
	cls.should.have.property( 'awards' ).and.be.an.Array();
}
