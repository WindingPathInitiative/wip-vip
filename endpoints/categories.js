'use strict';

const _       = require( 'lodash' );
const Promise = require( 'bluebird' );

const CategoryModel = require( '../models/category' );

const RequestError  = require( '../helpers/errors' ).RequestError;

class CategoryEndpoint {

	/**
	 * Constructor.
	 * @return {CategoryEndpoint}
	 */
	constructor() {
		return this;
	}


	/**
	 * Gets filterable list of categories.
	 * @param {Object} filter Filter object.
	 * @return {Promise}
	 */
	get( filter ) {
		filter = _.defaults( filter, {
			limit: 20,
			offset: 0,
			type: 'all'
		});

		let query = new CategoryModel();

		if ( 'all' !== filter.type ) {
			if ( 'vip' !== filter.type && 'prestige' !== filter.type ) {
				return new Promise.reject( new RequestError( 'Invalid category type' ) );
			}
			query.where( 'type', filter.type );
		}

		if ( filter.date ) {
			if ( isNaN( Date.parse( filter.date ) ) ) {
				return new Promise.reject( new RequestError( 'Invalid date' ) );
			}
			let date = new Date( filter.date );

			query.where( 'start', '<', date )
			.query( qb => {
				qb.where( function() {
					this.where( 'end', '>=', date ).orWhereNull( 'end' );
				});
			});
		}

		return query
		.fetchPage({
			limit: Math.min( filter.limit, 100 ),
			offset: filter.offset
		})
		.then( categories => {
			categories.each( category => category.showAll() );
			return categories.toJSON();
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
				return new CategoryEndpoint()
				.get( req.query )
				.then( categories => res.json({ results: categories }) )
				.catch( err => next( err ) );
			}
		);

		return router;
	}
}

module.exports = CategoryEndpoint;
