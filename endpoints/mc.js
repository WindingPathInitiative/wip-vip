'use strict';

const _ = require( 'lodash' );

const MembershipClassModel = require( '../models/mc' );

class MembershipClassEndpoint {

	/**
	 * Constructor.
	 * @param {Object} hub  The Hub interface.
	 * @param {Number} user The user ID.
	 * @return {MembershipClassEndpoint}
	 */
	constructor( hub, user ) {
		this.Hub    = hub;
		this.userId = user;
		return this;
	}


	/**
	 * Gets membership classes.
	 * @param {Object} filters Filter object.
	 * @return {Promise}
	 */
	get( filters ) {
		// Sets the default filter data.
		if ( ! _.has( filters, 'status' ) ) {
			filters.status = 'Approved';
		}

		// Either we're looking at approved awards, or we're National.
		let promise;
		if (  'Approved' === filters.status ) {
			promise = Promise.resolve();
		} else {
			promise = this.Hub.hasOverOrgUnit( 1, this.role([ 'request', 'approve', 'revoke' ]) );
		}

		// Get the data.
		return promise
		.then( () => this.filter( filters ) )
		.then( levels => levels.map( level => level.restrict().toJSON() ) );
	}



	/**
	 * Filters a group of classes.
	 * @param {Object}     filter The filter object.
	 * @param {MembershipClassModel} query  Optional. The Bookshelf Award model.
	 * @return {Promise}          Filtered Award model promise.
	 */
	filter( filter, query ) {
		if ( ! query ) {
			query = new MembershipClassModel();
		}

		filter = _.defaults( filter, {
			limit: 20,
			offset: 0,
			status: 'Approved'
		});

		if ( 'all' !== filter.status ) {
			query.where( 'status', filter.status );
		}

		if ( filter.user ) {
			if ( 'me' === filter.user ) {
				filter.user = this.userId;
			}
			query.where( 'user', filter.user );
		}
		if ( filter.level ) {
			query.where( 'level', filter.level );
		}
		if ( filter.office ) {
			query.where( 'office', filter.office );
		}
		if ( filter.dateBefore && NaN !== Date.parse( filter.dateBefore ) ) {
			query.where( 'date', '<', new Date( filter.dateBefore ) );
		}
		if ( filter.dateAfter && NaN !== Date.parse( filter.dateAfter ) ) {
			query.where( 'date', '>=', new Date( filter.dateAfter ) );
		}

		return query.fetchPage({
			limit: Math.min( filter.limit, 100 ),
			offset: filter.offset
		});
	}


	/**
	 * Gets a role name.
	 * @param {String} type The role type.
	 * @return {String}
	 */
	role( type ) {
		if ( _.isArray( type ) ) {
			return type.map( t => `mc_${t}` );
		}
		return `mc_${type}`;
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
				return new MembershipClassEndpoint( req.hub, req.user )
				.get( req.query )
				.then( classes => res.json({ results: classes }) )
				.catch( err => next( err ) );
			}
		);

		return router;
	}

}

module.exports = MembershipClassEndpoint;
