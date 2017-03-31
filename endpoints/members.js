'use strict';

const _       = require( 'lodash' );
const Promise = require( 'bluebird' );

const AwardModel    = require( '../models/award' );

class MembersEndpoint {
	/**
	 * Constructor.
	 * @param {Object} hub  The Hub interface.
	 * @param {Number} user The user ID.
	 * @return {AwardsEndpoint}
	 */
	constructor( hub, user ) {
		this.Hub    = hub;
		this.userId = user;
		return this;
	}


	/**
	 * Gets prestige awards for a member.
	 * @param {String|Number} user    The user ID.
	 * @param {Object}        filters Filter object.
	 * @return {Promise}
	 */
	prestige( user, filters ) {
		// Sets the default filter data.
		if ( ! _.has( filters, 'status' ) ) {
			filters.status = 'Awarded';
		}
		filters.user = user;
		filters.type = 'prestige';

		// Check for public or personal information, otherwise do a role check.
		let promise;
		if (
			'Awarded' === filters.status ||
			'me' === user ||
			Number.parseInt( user ) === this.userId
		) {
			promise = Promise.resolve( true );
		} else {
			promise = this.Hub.hasOverUser( user, 'prestige_view' );
		}

		// Get the data.
		return promise
		.then( () => this.filterAwards( filters ) )
		.then( awards => ({
			results: awards.toJSON(),
			pagination: awards.pagination
		}) );
	}


	/**
	 * Gets VIP awards for a member.
	 * @param {String|Number} user    The user ID.
	 * @param {Object}        filters Filter object.
	 * @return {Promise}
	 */
	vip( user, filters ) {
		// Sets the default filter data.
		if ( ! _.has( filters, 'status' ) ) {
			filters.status = 'Awarded';
		}
		filters.user = user;
		filters.type = 'vip';

		// Check for public or personal information, otherwise do a role check.
		let promise;
		if (
			'Awarded' === filters.status ||
			'me' === user ||
			Number.parseInt( user ) === this.userId
		) {
			promise = Promise.resolve( true );
		} else {
			promise = this.Hub.hasOverUser( user, 'vip_view' );
		}

		// Get the data.
		return promise
		.then( () => this.filterAwards( filters ) )
		.then( awards => ({
			results: awards.toJSON(),
			pagination: awards.pagination
		}) );
	}


	/**
	 * Filters a group of awards.
	 * @param {Object}     filter The filter object.
	 * @param {AwardModel} query  Optional. The Bookshelf Award model.
	 * @return {Promise}          Filtered Award model promise.
	 */
	filterAwards( filter, query ) {
		if ( ! query ) {
			query = new AwardModel();
		}

		filter = _.defaults( filter, {
			limit: 20,
			offset: 0,
			status: 'Awarded'
		});

		if ( 'all' !== filter.status ) {
			query.where( 'status', filter.status );
		}

		let falsey = 'testing' === process.env.NODE_ENV ? null : 0; // Use null for SQLite.
		if ( 'prestige' === filter.type ) {
			query.where( 'vip', falsey );
		} else if ( 'vip' === filter.type ) {
			query.where( 'vip', '<>', falsey );
		}

		if ( filter.user ) {
			if ( 'me' === filter.user ) {
				filter.user = this.userId;
			}
			query.where( 'user', filter.user );
		}
		if ( filter.category ) {
			query.where( 'categoryId', filter.category );
		}
		if ( filter.document ) {
			query.where( 'documentId', filter.document );
		}
		if ( filter.source ) {
			query.where( 'source', 'LIKE', `%${filter.source}%` );
		}
		if ( filter.description ) {
			query.where( 'description', 'LIKE', `%${filter.description}%` );
		}
		if ( filter.awarder ) {
			query.where( 'awarder', filter.awarder );
		}
		if ( filter.nominate ) {
			query.where( 'nominate', filter.nominate );
		}
		if ( filter.dateBefore && NaN !== Date.parse( filter.dateBefore ) ) {
			query.where( 'date', '<', new Date( filter.dateBefore ) );
		}
		if ( filter.dateAfter && NaN !== Date.parse( filter.dateAfter ) ) {
			query.where( 'date', '>=', new Date( filter.dateAfter ) );
		}

		return query.fetchPage({
			limit: Math.min( filter.limit, 100 ),
			offset: filter.offset,
			withRelated: [ 'category', 'document' ]
		});
	}


	/**
	 * Express routing helper.
	 */
	static route() {
		let router = require( 'express' ).Router();
		let hub    = require( '../helpers/hub' ).route;

		router.get( '/:user/prestige',
			hub,
			( req, res, next ) => {
				return new MembersEndpoint( req.hub, req.user )
				.prestige( req.params.user, req.query )
				.then( results => res.json( results ) )
				.catch( err => next( err ) );
			}
		);

		router.get( '/:user/vip',
			hub,
			( req, res, next ) => {
				return new MembersEndpoint( req.hub, req.user )
				.vip( req.params.user, req.query )
				.then( results => res.json( results ) )
				.catch( err => next( err ) );
			}
		);

		return router;
	}
}

module.exports = MembersEndpoint;
