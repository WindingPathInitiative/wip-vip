'use strict';

/* eslint-env node, mocha */

const should = require( 'should' ); // eslint-disable-line no-unused-vars

const helpers = require( './helpers' );
const hub = helpers.hub;

const MembershipClassEndpoint = require( '../endpoints/mc' );

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
