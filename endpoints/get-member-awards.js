'use strict';

const Promise = require( 'bluebird' );

class GetMemberAwards {
	constructor( awards, hub, user ) {
		this.Award = awards;
		this.Hub = hub;
		this.user = user;
		return this;
	}

	get( user, status ) {
		if ( ! status ) {
			status = 'Awarded';
		}

		// If the user is themselves, they can see it.
		let promise;
		if ( Number.parseInt( user ) === this.user ) {
			promise = Promise.resolve();
		} else {
			promise = this.Hub.hasOverUser( user, 'prestige_view' );
		}

		return promise
		.then( () => {
			return this.Award.where({
				user: user,
				status: status
			}).fetchAll({
				withRelated: [ 'category' ]
			});
		})
		.then( awards => awards.toJSON() );
	}

	static route( app ) {
		app.get( '/v1/awards/member/:user(\\d+)',
			require( '../helpers/hub' ).route,
			( req, res, next ) => {
				let Award = require( '../models/award' );
				return new GetMemberAwards( Award, req.hub, req.user )
				.get( req.params.user )
				.then( awards => res.json( awards ) )
				.catch( err => next( err ) );
			}
		);
	}
}

module.exports = GetMemberAwards;
