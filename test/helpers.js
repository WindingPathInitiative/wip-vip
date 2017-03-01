'use strict';

const Hub = require( '../helpers/hub' );

function getHub( status, body ) {
	if ( ! body ) {
		body = { message: 'Success' };
	}

	let req = params => Promise.resolve({
		statusCode: status || 200,
		body: Object.assign( {}, params.qs, body )
	});

	return new Hub( 'base', 'token', req );
}
module.exports.hub = getHub;
