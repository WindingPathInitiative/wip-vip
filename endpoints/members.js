'use strict';

const _       = require( 'lodash' );
const Promise = require( 'bluebird' );

const AwardModel           = require( '../models/award' );
const MembershipClassModel = require( '../models/mc' );

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


	info( user ) {
		if ( 'me' === user ) {
			user = this.userId;
		}

		return Promise.join(
			AwardModel.getUserTotals( user ),
			AwardModel.getUserVip( user ),
			MembershipClassModel.getUserLevel( user ),
			( prestige, vip, mc ) => ({ prestige: prestige, vip: vip, membershipClass: mc })
		);
	}


	/**
	 * Gets prestige awards for a member.
	 * @param {String|Number} user    The user ID.
	 * @param {Object}        filters Filter object.
	 * @param {String}        type    Type of award to get.
	 * @return {Promise}
	 */
	get( user, filters, type ) {
		// Sets the default filter data.
		if ( ! _.has( filters, 'status' ) ) {
			filters.status = 'Awarded';
		}
		filters.user = user;
		if ( type ) {
			filters.type = type;
		}

		// Check for public or personal information, otherwise do a role check.
		let promise;
		if (
			'Awarded' === filters.status ||
			'me' === user ||
			Number.parseInt( user ) === this.userId
		) {
			promise = Promise.resolve( true );
		} else {
			let role = 'prestige_view';
			if ( 'vip' === type ) {
				role = [ 'vip_view', 'prestige_view' ];
			}
			promise = this.Hub.hasOverUser( user, role );
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

		if ( 'prestige' === filter.type ) {
			query.wherePrestige();
		} else if ( 'vip' === filter.type ) {
			query.whereVip();
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

		router.get( '/:user(\\d+|me)',
			hub,
			( req, res, next ) => {
				return new MembersEndpoint( req.hub, req.user )
				.info( req.params.user )
				.then( results => res.json( results ) )
				.catch( err => next( err ) );
			}
		)

		router.get( '/:user(\\d+|me)/awards',
			hub,
			( req, res, next ) => {
				return new MembersEndpoint( req.hub, req.user )
				.get( req.params.user, req.query )
				.then( results => res.json( results ) )
				.catch( err => next( err ) );
			}
		);

		router.get( '/:user(\\d+|me)/prestige',
			hub,
			( req, res, next ) => {
				return new MembersEndpoint( req.hub, req.user )
				.get( req.params.user, req.query, 'prestige' )
				.then( results => res.json( results ) )
				.catch( err => next( err ) );
			}
		);

		router.get( '/:user(\\d+|me)/vip',
			hub,
			( req, res, next ) => {
				return new MembersEndpoint( req.hub, req.user )
				.get( req.params.user, req.query, 'vip' )
				.then( results => res.json( results ) )
				.catch( err => next( err ) );
			}
		);

		return router;
	}
}

module.exports = MembersEndpoint;
