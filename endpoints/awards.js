'use strict';

const _       = require( 'lodash' );
const Promise = require( 'bluebird' );

const AwardModel    = require( '../models/award' );
const CategoryModel = require( '../models/category' );
const ActionModel   = require( '../models/action' );

const RequestError  = require( '../helpers/errors' ).RequestError;
const AuthError     = require( '../helpers/errors' ).AuthError;
const NotFoundError = require( '../helpers/errors' ).NotFoundError;

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
		this.levels = [ 'general', 'regional', 'national'  ];
		this.type   = 'prestige';
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
			promise = this.Hub.hasOverOrgUnit( 1, this.role( 'view' ) );
		}

		// Get the data.
		return promise
		.then( () => this.filterAwards( filters ) )
		.then( awards => awards.toJSON() );
	}


	/**
	 * Gets an individual award.
	 * @param {Number} id The award ID.
	 * @return {Promise}
	 */
	getOne( id ) {
		return this.query({ id: id })
		.fetch({ require: true, withRelated: [ 'category', 'document' ] })
		.catch( () => {
			throw new NotFoundError();
		})
		.tap( award => {
			if (
				'Awarded' === award.get( 'status' ) ||
				Number.parseInt( award.get( 'user' ) ) === this.userId
			) {
				return null;
			}
			return this.Hub.hasOverUser( award.get( 'user' ), this.role( 'view' ) );
		})
		.then( award => award.toJSON() );
	}


	/**
	 * Creates an award.
	 * @param {Object} data Data to create from.
	 * @return {Promise}
	 */
	create( data ) {
		let officeId;
		return this.validateAward( data )
		.tap( data => {
			if ( 'request' === data.action ) {
				return;
			}
			let role = this.role( data.action );
			if ( 'award' === data.action && data.level ) {
				role += `_${data.level}`;
			}
			return this.Hub.hasOverUser( data.user, role )
			.then( id => {
				officeId = id;
				if ( 'nominate' === data.action ) {
					data.nominate = id;
				} else {
					data.awarder = id;
				}
			});
		})
		.then( data => _.omit( data, [ 'action', 'level' ] ) )
		.then( data => new AwardModel( data ).save() )
		.then( award => award.refresh({ withRelated: [ 'category' ] }) )
		.tap( award => {
			if ( officeId ) {
				return this.createAction( award, officeId, null, data.note );
			}
		})
		.then( award => {
			if ( ! award ) {
				console.log( data );
			}
			return award.toJSON()
		});
	}


	/**
	 * Updates an award.
	 * @param {Number} id     ID of award of update.
	 * @param {Object} data   Data to update.
	 * @param {Object} levels Optional. MC levels.
	 * @return {Promise}
	 */
	update( id, data, levels ) {
		let officeId;
		let validate = this.validateAward( data )
		.tap( data => {
			data.id = id;
			if ( 'request' === data.action ) {
				officeId = 0;
				return;
			}
			let role = this.role( data.action );
			if ( 'award' === data.action && data.level ) {
				role += `_${data.level}`;
			}
			return this.Hub.hasOverUser( data.user, role )
			.then( id => {
				officeId = id;
				if ( 'nominate' === data.action ) {
					data.nominate = id;
				} else {
					data.awarder = id;
				}
			});
		})
		.then( data => _.omit( data, [ 'action', 'level' ] ) );

		let get = this.query({ id: id })
		.fetch({ require: true, withRelated: [ 'review' ] })
		.catch( () => {
			throw new NotFoundError();
		});

		if ( ! levels ) {
			levels = require( '../membership-classes' );
		}

		return Promise.join(
			validate, get,
			( valid, model ) => {
				let prev = model.toJSON();
				if ( ! officeId && 'Requested' !== model.get( 'status' ) ) {
					throw new AuthError( 'Cannot modify own approved awards' );
				}
				let action = 'Modified';
				if ( valid.status !== model.get( 'status' ) ) {
					action = valid.status;
				}
				if ( model.get( 'mcReviewId' ) ) {
					if (
						( valid.usableGeneral && valid.usableGeneral !== prev.usableGeneral ) ||
						( valid.usableRegional && valid.usableRegional !== prev.usableRegional ) ||
						( valid.usableNational && valid.usableNational !== prev.usableNational )
					) {
						valid.mcReviewId = null;
					}
				}
				return this.createAction( model, officeId, action, data.note, prev )
				.then( () => model.save( valid ) )
				.tap( () => {
					if ( prev.review && prev.review.id && null === valid.mcReviewId ) {
						return model.related( 'review' ).reset( levels );
					}
				});
			}
		)
		.then( award => award.refresh({ withRelated: [ 'category', 'document' ] }) )
		.then( award => award.toJSON() );
	}


	/**
	 * Deletes an award.
	 * @param {Number} id   ID of award to remove.
	 * @param {String} note Optional. Note to attach to removal.
	 * @param {Object} levels Optional. MC levels.
	 * @return {Promise}
	 */
	delete( id, note, levels ) {
		let officeId, mcReviewId;

		if ( ! levels ) {
			levels = require( '../membership-classes' );
		}

		return this.query({ id: id })
		.fetch({ require: true, withRelated: [ 'category', 'document' ] })
		.catch( () => {
			throw new NotFoundError();
		})
		.then( award => {
			let status = award.get( 'status' );

			if ( 'Requested' === status && this.userId === award.get( 'user' ) ) {
				return award;
			} else if ( 'Removed' === status ) {
				throw new RequestError( 'Award is already removed' );
			}

			let promise;
			if ( 'Requested' !== status ) {
				let creatingOfficeId;
				if ( 'Nominated' === status ) {
					creatingOfficeId = award.get( 'nominate' );
				} else {
					creatingOfficeId = award.get( 'awarder' );
				}
				promise = this.Hub.userOffices()
				.then( offices => {
					if ( ! offices.length ) {
						throw new AuthError( 'User has no offices' );
					}
					let ids = _.map( offices, 'id' );
					if ( -1 !== ids.indexOf( creatingOfficeId ) ) {
						officeId = creatingOfficeId;
						return true;
					}
					return false;
				});
			} else {
				promise = Promise.resolve( false );
			}

			return promise
			.then( result => {
				if ( ! result ) {
					return this.Hub.hasOverUser( award.get( 'user' ), this.role( 'deduct' ) )
					.then( id => {
						officeId = id;
						return award;
					});
				}
				return award;
			});
		})
		.tap( award => {
			mcReviewId = award.get( 'mcReviewId' );
			if ( officeId ) {
				return this.createAction( award, officeId, 'Removed', note, award.toJSON() );
			}
		})
		.then( award => award.save( { status: 'Removed', mcReviewId: null }, { patch: true } ) )
		.tap( () => {
			if ( mcReviewId ) {
				let MembershipClassModel = require( '../models/mc' );
				return new MembershipClassModel({ id: mcReviewId }).fetch()
				.then( review => review.reset( levels ) );
			}
		})
		.then( award => award.toJSON() );
	}


	/**
	 * Gets a new Award model.
	 * @param {Object} map Optional. Map of inital values.
	 * @return {AwardModel}
	 */
	query( map ) {
		return new AwardModel( map );
	}


	/**
	 * Gets a role name.
	 * @param {String} type The role type.
	 * @return {String}
	 */
	role( type ) {
		return `prestige_${type}`;
	}


	/**
	 * Filters a group of awards.
	 * @param {Object}     filter The filter object.
	 * @param {AwardModel} query  Optional. The Bookshelf Award model.
	 * @return {Promise}          Filtered Award model promise.
	 */
	filterAwards( filter, query ) {
		if ( ! query ) {
			query = this.query();
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

		// Clone data to not mutate reference.
		data = _.clone( data );

		let constraints = {
			user: { presence: true, numericality: { onlyInteger: true, greaterThan: 0 } },
			category: { presence: true, numericality: { onlyInteger: true, greaterThan: 0 } },
			date: { presence: true, date: true },
			action: { presence: true, inclusion: [ 'request', 'nominate', 'award', 'deduct' ] },
			description: { presence: true },
			source: {}
		};

		let constaint = { numericality: { onlyInteger: true, greaterThanOrEqualTo: 0 } };
		this.levels.forEach( level => {
			constraints[ level ] = constaint;
			if ( 'award' === data.action ) {
				constraints[ 'usable' + _.capitalize( level ) ] = constaint;
			}
		});

		// Sets the user for self.
		if ( 'me' === data.user ) {
			data.user = this.userId;
		}

		// Force the type of action.
		if ( Number.parseInt( data.user ) === this.userId ) {
			data.action = 'request';
		} else if ( ! data.action ) {
			data.action = 'nominate';
		}

		if ( 'deduct' === data.action ) {
			this.levels.forEach( level => {
				delete constraints[ level ].numericality.greaterThanOrEqualTo;
				constraints[ level ].numericality.lessThanOrEqualTo = 0;
			});
		}

		// Validate and clean up.
		let errors = validate( data, constraints );
		if ( errors ) {
			return Promise.reject( new RequestError( `Errors found: ${errors.join( ', ' )}` ) );
		}

		data = validate.cleanAttributes( data, constraints );

		// Exit if no prestige is set.
		let prestige = false
		this.levels.forEach( level => {
			if ( data[ level ] ) {
				prestige = true;
			}
		});
		if ( ! prestige ) {
			return Promise.reject( new RequestError( 'No prestige awarded' ) );
		}

		// Sets the correct status.
		if ( 'request' === data.action ) {
			data.status = 'Requested';
		} else if ( 'nominate' === data.action ) {
			data.status = 'Nominated';
		} else {
			data.status = 'Awarded';
		}

		// Checks if the category exists.
		return new CategoryModel({ id: data.category })
		.where( 'type', this.type )
		.where( 'start', '<', data.date )
		.query( qb => {
			qb.where( function() {
				this.where( 'end', '>=', data.date ).orWhereNull( 'end' );
			});
		})
		.fetch({ required: true })
		.catch( () => {
			throw new RequestError( 'Invalid category ID' );
		})
		.then( category => {
			category = category.toJSON();
			data.categoryId = category.id;
			delete data.category;

			this.levels.forEach( level => {
				let key = 'usable' + _.capitalize( level );
				if ( data[ level ] ) {
					let cur = data[ key ] || data[ level ];
					data[ key ] = Math.min( category.entryLimit, cur );
					if ( 'vip' !== level ) {
						data.level = level;
					}
				}
			});

			return data;
		});
	}


	/**
	 * Creates and saves an action.
	 * @param {AwardModel} award    The award.
	 * @param {Number}     officeId Officer ID.
	 * @param {String}     action   Optional. The action to save.
	 * @param {String}     note     Optional. The note to save.
	 * @param {Object}     prev     Optional. Previous data.
	 * @return {ActionModel}
	 */
	createAction( award, officeId, action, note, prev ) {
		return new ActionModel({
			awardId: award.get( 'id' ),
			office: officeId,
			user: this.userId,
			action: action || award.get( 'status' ),
			previous: prev || {},
			note: note
		}).save();
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

		router.get( '/:id',
			hub,
			( req, res, next ) => {
				return new AwardsEndpoint( req.hub, req.user )
				.getOne( req.params.id )
				.then( award => res.json( award ) )
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

		router.put( '/:id(\\d+)',
			hub,
			( req, res, next ) => {
				return new AwardsEndpoint( req.hub, req.user )
				.update( req.params.id, req.body )
				.then( award => res.json( award ) )
				.catch( err => next( err ) );
			}
		);

		router.delete( '/:id(\\d+)',
		hub,
		( req, res, next ) => {
			return new AwardsEndpoint( req.hub, req.user )
			.delete( req.params.id, req.body.note )
			.then( award => res.json( award ) )
			.catch( err => next( err ) );
		}
		);

		return router;
	}
}

module.exports = AwardsEndpoint;
