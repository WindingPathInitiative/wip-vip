'use strict';

const Promise = require( 'bluebird' );

const Hub = require( '../helpers/hub' );

function getHub( status, body ) {
	if ( ! body ) {
		body = { message: 'Success', offices: [{ id: 1 }] };
	}

	const req = () => {
		return Promise.resolve({
			statusCode: status || 200,
			body: body
		});
	}

	return new Hub( 'base', 'token', req );
}
module.exports.hub = getHub;


function seriesHub( responses ) {

	const req = () => {
		let resp = responses.shift();
		return Promise.resolve( Object.assign({
			statusCode: 200,
			body: {}
		}, resp ) );
	}

	return new Hub( 'base', 'token', req );
}
module.exports.seriesHub = seriesHub;


function roleHub( status, body, testRoles ) {
	let hub = getHub( status, body );
	if ( 'array' !== typeof testRoles ) {
		testRoles = [ testRoles ];
	}
	hub.roles = ( roles ) => {
		roles = new Hub().roles( roles );
		roles.should.be.a.String().and.equal( testRoles.join( ',' ) );
		return roles;
	}
	return hub;
}
module.exports.roleHub = roleHub;


function resetDB( done ) {
	let knex = require( '../helpers/db' );
	knex.seed.run().then( () => done() );
}
module.exports.resetDB = resetDB;
