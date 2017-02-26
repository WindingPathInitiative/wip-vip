'use strict';

const Promise = require( 'bluebird' );

module.exports.getMemberAwards = ( event, context, callback ) => {

	let Award = require( './models/award' );
	let GetMemberAwards = require( './endpoints/get-member-awards' );

	new GetMemberAwards( Award, hub( event.authorizationToken ) );

	callback( null, res( { message: 'Success' } ) );
};

function hub( token ) {
	let Hub    = require( './helpers/hub' );
	let baseUrl = require( './helpers/config' ).hubUrl;
	let request = Promise.promisify( require( 'request' ) );

	return new Hub( baseUrl, token, request );
}

function res( body, status ) {
	return {
		statusCode: status || 200,
		body: JSON.stringify( body )
	}
}
