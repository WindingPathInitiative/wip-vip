'use strict';

const _       = require( 'lodash' );
const Promise = require( 'bluebird' );

const AwardModel    = require( '../models/award' );
const CategoryModel = require( '../models/category' );
const RequestError  = require( '../helpers/errors' ).RequestError;

class AwardsEndpoint {

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
	 * Gets awards.
	 * @param {Object} filters Filter object.
	 * @return {Promise}
	 */
	get( filters ) {
		// Sets the default filter data.
		if ( ! _.has( filters, 'status' ) ) {
			filters.status = 'Awarded';
		}

		// Either we're looking at approved awards, or we're National.
		let promise;
		if (  'Awarded' === filters.status ) {
			promise = Promise.resolve();
		} else {
			promise = this.Hub.hasOverOrgUnit( 1, 'prestige_view' );
		}

		// Get the data.
		return promise
		.then( () => this.filterAwards( filters ) )
		.then( awards => awards.toJSON() );
	}


	/**
	 * Gets awards for a given member.
	 * @param {String|Number} user    The user ID.
	 * @param {Object}        filters Filter object.
	 * @return {Promise}
	 */
	getMember( user, filters ) {
		// Sets the default filter data.
		if ( ! _.has( filters, 'status' ) ) {
			filters.status = 'Awarded';
		}
		filters.user = user;

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
		.then( awards => awards.toJSON() );
	}


	/**
	 * Creates an award.
	 * @param {Object} data Data to create from.
	 * @return {Promise}
	 */
	create( data ) {
		return this.validateAward( data );
	}


	/**
	 * Updates an award.
	 * @param {Number} id   ID of award of update.
	 * @param {Object} data Data to update.
	 * @return {Promise}
	 */
	update( id, data ) {
		return this.validateAward( data );
	}


	/**
	 * Deletes an award.
	 * @param {Number} id ID of award to remove.
	 * @return {Promise}
	 */
	delete( id ) {
		new AwardModel({ id: id }).delete();
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

		if ( filter.user ) {
			if ( 'me' === filter.user ) {
				filter.user = this.userId;
			}
			query.where( 'user', filter.user );
		}
		if ( filter.category ) {
			query.where( 'categoryId', filter.category );
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
			withRelated: [ 'category' ]
		});
	}


	/**
	 * Validates award data.
	 * @param {Object} data Award data.
	 * @return {Promise}
	 */
	validateAward( data ) {
		const validate = require( '../helpers/validation' );

		let constraints = {
			user: { presence: true, numericality: { onlyInteger: true } },
			category: { presence: true, numericality: { onlyInteger: true } },
			date: { presence: true, date: true },
		};
		let numbers = [ 'general', 'regional', 'national'  ];
		numbers.forEach( number => {
			constraints[ number ] = { numericality: { onlyInteger: true } };
			constraints[ 'usable' + _.capitalize( number ) ] = {
				numericality: { onlyInteger: true }
			};
		});

		let errors = validate( data, constraints );
		if ( errors ) {
			errors = validate.format( errors );
			return Promise.reject( new RequestError( `Errors found: ${errors}` ) );
		}

		data = validate.cleanAttributes( data, constraints );

		return new CategoryModel({ id: data.category })
		.where( 'start', '<', data.date )
		.query( qb => {
			qb.where( function() {
				this.where( 'end', '>=', data.date ).orWhereNull( 'end' );
			});
		})
		.fetch({ required: true })
		.then( category => {
			category = category.toJSON();
			data.categoryId = category.id;
			delete data.category;

			numbers.forEach( number => {
				let key = 'usable' + _.capitalize( number );
				if ( data[ number ] && data[ number ] > category.entryLimit ) {
					let cur = data[ key ] || 10000;
					data[ key ] = Math.min( category.entryLimit, cur );
				}
			});

			return data;
		})
		.catch( () => {
			throw new RequestError( 'Invalid category ID' );
		});
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
				return new AwardsEndpoint( req.hub, req.user )
				.get( req.query )
				.then( awards => res.json({ results: awards }) )
				.catch( err => next( err ) );
			}
		);

		router.get( '/member/:user',
			hub,
			( req, res, next ) => {
				return new AwardsEndpoint( req.hub, req.user )
				.getMember( req.params.user, req.query )
				.then( awards => res.json({ results: awards }) )
				.catch( err => next( err ) );
			}
		);

		router.post( '/',
			hub,
			( req, res, next ) => {
				return new AwardsEndpoint( req.hub, req.user )
				.create( req.body )
				.then( award => res.json( award ) )
				.catch( err => next( err ) );
			}
		);

		return router;
	}
}

module.exports = AwardsEndpoint;
