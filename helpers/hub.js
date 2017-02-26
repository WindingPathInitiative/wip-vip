'use strict';

const _ = require( 'lodash' );

const AuthError = require( './errors' ).AuthError;

class Hub {
	constructor( url, token, request ) {
		this.baseUrl = url;
		this.token = token;
		this.requestFunc = request;
		return this;
	}

	request( url, qs ) {
		qs = qs || {};
		return this.requestFunc({
			baseUrl: this.baseUrl,
			qs: _.merge( qs, { token: this.token } ),
			url: url,
			json: true
		}).then( resp => {
			if ( 200 !== resp.statusCode ) {
				throw new AuthError( resp.body.message );
			}
			return resp.body;
		});
	}

	hasOverUser( user, roles ) {
		roles = roles || [];
		return this.request( `/v1/office/verify/user/${user}`, { roles: roles } )
		.then( () => true )
		.catch( () => false );
	}
}

module.exports = Hub;
