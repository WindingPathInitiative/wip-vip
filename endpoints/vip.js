'use strict';

const AwardsEndpoint = require( './awards' );

const AwardModel     = require( '../models/award' );

class VIPEndpoint extends AwardsEndpoint {

	/**
	 * Constructor.
	 * @param {Object} hub  The Hub interface.
	 * @param {Number} user The user ID.
	 * @return {VIPEndpoint}
	 */
	constructor( hub, user ) {
		super( hub, user );
		this.levels = [ 'vip' ];
		this.type = 'vip';
		return this;
	}


	/**
	 * Gets a new Award model.
	 * @param {Object} map Optional. Map of inital values.
	 * @return {AwardModel}
	 */
	query( map ) {
		return new AwardModel( map ).whereVip();
	}


	/**
	 * Gets a role name.
	 * @param {String} type The role type.
	 * @return {String}
	 */
	role( type ) {
		return [ `prestige_${type}`, `vip_${type}` ];
	}


	/**
	 * Express routing helper.
	 */
	static route() {
		let router = require( 'express' ).Router();
		let hub    = require( '../helpers/hub' ).route;

		router.get( '/',
			hub,
			( req, res, next ) => {
				return new VIPEndpoint( req.hub, req.user )
				.get( req.query )
				.then( awards => res.json({ results: awards }) )
				.catch( err => next( err ) );
			}
		);

		router.get( '/:id(\\d+)',
			hub,
			( req, res, next ) => {
				return new VIPEndpoint( req.hub, req.user )
				.getOne( req.params.id )
				.then( award => res.json( award ) )
				.catch( err => next( err ) );
			}
		);

		router.post( '/',
			hub,
			( req, res, next ) => {
				return new VIPEndpoint( req.hub, req.user )
				.create( req.body )
				.then( award => res.json( award ) )
				.catch( err => next( err ) );
			}
		);

		router.put( '/:id(\\d+)',
			hub,
			( req, res, next ) => {
				return new VIPEndpoint( req.hub, req.user )
				.update( req.params.id, req.body )
				.then( award => res.json( award ) )
				.catch( err => next( err ) );
			}
		);

		router.delete( '/:id(\\d+)',
		hub,
		( req, res, next ) => {
			return new VIPEndpoint( req.hub, req.user )
			.delete( req.params.id, req.body.note )
			.then( award => res.json( award ) )
			.catch( err => next( err ) );
		}
		);

		return router;
	}
}

module.exports = VIPEndpoint;
