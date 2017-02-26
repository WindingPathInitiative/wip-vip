'use strict';

class AuthError extends Error {
	constructor( message, status ) {
		super( message );
		this.name = 'AuthError';
		this.status = status || 403;
	}
}
module.exports.AuthError = AuthError;
