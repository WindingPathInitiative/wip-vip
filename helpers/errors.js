'use strict';

class AuthError extends Error {
	constructor( message, status ) {
		super( message );
		this.name = 'AuthError';
		this.status = status || 403;
	}
}
module.exports.AuthError = AuthError;


class RequestError extends Error {
	constructor( message, status ) {
		super( message );
		this.name = 'RequestError';
		this.status = status || 400;
	}
}
module.exports.RequestError = RequestError;


class NotFoundError extends Error {
	constructor( message, status ) {
		message = message || 'Not found';
		super( message );
		this.name = 'NotFoundError';
		this.status = status || 404;
	}
}
module.exports.NotFoundError = NotFoundError;
