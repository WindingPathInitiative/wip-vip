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

	userOffices() {
		return this.request( '/v1/office/me' );
	}

	hasOverUser( user, roles ) {
		return this.request( `/v1/office/verify/user/${user}`, { roles: this.roles( roles ) } )
		.then( resp => _.get( resp, 'offices[0].id', 0 ) );
	}

	hasOverOrgUnit( org, roles ) {
		return this.request( `/v1/office/verify/orgunit/${org}`, { roles: this.roles( roles ) } )
		.then( resp => _.get( resp, 'offices[0].id', 0 ) );
	}


	roles( roles ) {
		roles = roles || '';
		if ( _.isArray( roles ) ) {
			roles = roles.join( ',' );
		}
		return roles;
	}

	/**
	 * Express middleware.
	 * @param {Object}   req Request object.
	 * @param {Object}   res Response object.
	 * @param {Function} next Callback.
	 */
	static route( req, res, next ) {
		let baseUrl = require( '../helpers/config' ).hubUrl;
		let Promise = require( 'bluebird' );
		let request = Promise.promisify( require( 'request' ) );

		if ( 'authorization' in req.headers ) {
			req.query.token = req.headers.authorization.toLowerCase().replace( 'bearer ', '' );
		}
		let token = req.query.token;

		if ( ! token ) {
			return next( new AuthError( 'No token provided' ) );
		}

		req.hub = new Hub( baseUrl, token, request );
		if ( 'auth-user' in req.headers ) {
			req.user = Number.parseInt( req.headers['auth-user'] );
			return next();
		} else {
			return req.hub.request( '/v1/user/me' )
			.then( user => {
				req.user = Number.parseInt( user.id );
				return next();
			})
			.catch( err => next( err ) );
		}
	}
}

module.exports = Hub;
