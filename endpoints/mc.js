'use strict';

const _       = require( 'lodash' );
const Promise = require( 'bluebird' );

const MembershipClassModel = require( '../models/mc' );
const AwardModel           = require( '../models/award' );
const ActionModel          = require( '../models/action' );

const NotFoundError = require( '../helpers/errors' ).NotFoundError;
const RequestError  = require( '../helpers/errors' ).RequestError;

class MembershipClassEndpoint {

	/**
	 * Constructor.
	 * @param {Object} hub  The Hub interface.
	 * @param {Number} user The user ID.
	 * @return {MembershipClassEndpoint}
	 */
	constructor( hub, user, levels ) {
		this.Hub    = hub;
		this.userId = user;
		this.levels = levels;
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
	 * Gets an individual class.
	 * @param {Number} id The class ID.
	 * @return {Promise}
	 */
	getOne( id ) {
		return new MembershipClassModel({ id: id })
		.fetch({ require: true, withRelated: 'awards' })
		.catch( () => {
			throw new NotFoundError();
		})
		.tap( cls => {
			if (
				'Approved' === cls.get( 'status' ) ||
				Number.parseInt( cls.get( 'user' ) ) === this.userId
			) {
				return null;
			}
			return this.Hub.hasOverUser( cls.get( 'user' ), this.role([ 'request', 'approve', 'revoke' ]) );
		})
		.then( cls => cls.toJSON() );
	}


	/**
	 * Creates a MC request
	 * @param {Number} userId User ID to request MC for.
	 * @param {Number} level  Level to request.
	 * @return {Promise}
	 */
	create( userId, level ) {
		let promise, officeId;

		level = Number.parseInt( level );

		if ( 1 === level ) {
			return Promise.reject( new RequestError( 'All members have MC 1' ) );
		}

		let levelData = this.levels[ level ];
		if ( ! Number.parseInt( level ) || ! levelData ) {
			return Promise.reject( new RequestError( 'Invalid level' ) );
		}

		if ( userId !== this.userId && 15 !== level ) {
			promise = this.Hub.hasOverUser( userId, this.role( 'request' ) )
			.then( id => {
				officeId = id;
			});
		} else {
			promise = Promise.resolve();
		}

		return promise
		.then( () => new MembershipClassModel()
			.where( 'user', userId )
			.where( 'level', '>=', level )
			.where( 'status', '<>', 'Removed' )
			.orderBy( 'level', 'DESC' )
			.fetch()
		).then( cls => {
			if ( cls && cls.get( 'level' ) === level ) {
				throw new RequestError( `User already has level at ID ${cls.id}` );
			} else if ( cls ) {
				throw new RequestError( 'User already is higher level' );
			}
			return AwardModel.getUserTotals( userId );
		})
		.tap( totals => {

			if ( 15 === level ) {
				return;
			}

			if (
				levelData.national > totals.national ||
				levelData.regional > ( totals.regional + totals.national ) ||
				levelData.general > totals.total
			) {
				throw new RequestError( 'User does not have needed prestige' );
			}
		})
		.then( totals => new MembershipClassModel({
			user: userId,
			date: new Date(),
			level: level,
			general: totals.general,
			regional: totals.regional,
			national: totals.national,
			status: 'Requested',
			currentLevel: 'Domain',
			office: 0
		}).save() )
		.tap( cls => new AwardModel()
			.where({ user: userId, mcReviewId: null, status: 'Awarded', vip: null })
			.fetchAll()
			.then( awards => awards.invokeThen( 'save', 'mcReviewId', cls.id ) )
		)
		.tap( cls => {
			if ( officeId ) {
				return this.createAction( cls, officeId, 'Nominated' );
			}
		})
		.tap( cls => cls.related( 'awards' ).fetch() )
		.then( cls => cls.toJSON() );
	}


	/**
	 * Approves an award at a given level.
	 * @param {Number} id    ID of award to approve.
	 * @param {String} level Level to approve at.
	 * @param {String} note  Optional. Note to save as part of action.
	 * @return {Promise}
	 */
	approve( id, level, note ) {
		let levels = [ 'domain', 'regional', 'national' ];
		if ( -1 === levels.indexOf( level ) ) {
			return Promise.reject( new RequestError( 'Invalid level specified' ) );
		}

		let officeId, prev;

		return new MembershipClassModel({ id: id })
		.fetch({ require: true })
		.catch( () => {
			throw new NotFoundError();
		})
		.tap( cls => {
			let status = cls.get( 'status' );
			if ( 'Approved' === status ) {
				throw new RequestError( 'Award already approved' );
			} else if ( 'Removed' === status ) {
				throw new RequestError( 'Award is removed' );
			} else if ( level !== cls.get( 'currentLevel' ).toLowerCase() ) {
				throw new RequestError( `Award is not at ${level} level` );
			}

			return this.Hub.hasOverUser( cls.get( 'user' ), this.role( `approve_${level}` ) )
			.then( id => {
				officeId = id;
			});
		})
		.tap( cls => {

			let data      = cls.toJSON();
			let levelData = this.levels[ data.level ];

			if ( 15 === data.level ) {
				return;
			}

			if (
				levelData.national > data.national ||
				levelData.regional > ( data.regional + data.national ) ||
				levelData.general > ( data.general + data.regional + data.national )
			) {
				throw new RequestError( 'User does not have needed prestige' );
			}
		})
		.then( cls => {
			prev = cls.toJSON();

			let levelData = this.levels[ cls.get( 'level' ) ];
			let status = 'Reviewing';

			if ( 'national' === level || levelData.officer === level ) {
				status = 'Approved';
				cls.set( 'office', officeId );
			} else {
				let newLevel = levels[ levels.indexOf( level ) + 1 ];
				cls.set( 'currentLevel', _.upperFirst( newLevel ) );
			}

			cls.set( 'status', status );
			return cls.save();
		})
		.tap( cls => {
			let action = 'Modified';
			if ( 'Approved' === cls.get( 'status' ) ) {
				action = 'Awarded';
			}
			return this.createAction( cls, officeId, action, note, prev );
		})
		.tap( cls => cls.related( 'awards' ).fetch() )
		.then( cls => cls.toJSON() );
	}


	/**
	 * Sets an award to be removed.
	 * @param {Number} id   ID of membership class.
	 * @param {String} note Optional. Notes about removal.
	 * @return {Promise}
	 */
	remove( id, note ) {
		let officeId, prev;

		return new MembershipClassModel({ id: id })
		.fetch({ require: true })
		.catch( () => {
			throw new NotFoundError();
		})
		.tap( cls => {
			let status = cls.get( 'status' );
			if ( 'Removed' === status ) {
				throw new RequestError( 'Review is already removed' );
			}

			prev = cls.toJSON();

			return this.Hub.hasOverUser( cls.get( 'user' ), this.role( 'revoke' ) )
			.then( id => {
				officeId = id;
			});
		})
		.then( cls => cls.save( 'status', 'Removed' ) )
		.tap( cls => this.createAction( cls, officeId, 'Removed', note, prev ) )
		.tap( cls => cls.related( 'awards' ).fetch()
			.then( awards => awards.invokeThen( 'save', { mcReviewId: null } ) )
		)
		.then( cls => cls.toJSON() );
	}


	/**
	 * Returns the level data.
	 * @return {Object}
	 */
	getLevels() {
		return this.levels;
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
	 * Creates and saves an action.
	 * @param {MembershipClassModel} award    The award.
	 * @param {Number}               officeId Officer ID.
	 * @param {String}               action   Optional. The action to save.
	 * @param {String}               note     Optional. The note to save.
	 * @param {Object}               prev     Optional. Previous data.
	 * @return {ActionModel}
	 */
	createAction( cls, officeId, action, note, prev ) {
		return new ActionModel({
			mcId: cls.get( 'id' ),
			office: officeId,
			user: this.userId,
			action: action || cls.get( 'status' ),
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
		let levels = require( '../membership-classes' );

		router.get( '/',
			hub,
			( req, res, next ) => {
				return new MembershipClassEndpoint( req.hub, req.user, levels )
				.get( req.query )
				.then( classes => res.json({ results: classes }) )
				.catch( err => next( err ) );
			}
		);

		router.get( '/:id(\\d+)',
			hub,
			( req, res, next ) => {
				return new MembershipClassEndpoint( req.hub, req.user, levels )
				.getOne( req.params.id )
				.then( cls => res.json( cls ) )
				.catch( err => next( err ) );
			}
		);

		router.get( '/levels',
			hub,
			( req, res ) => {
				res.json( new MembershipClassEndpoint( req.hub, req.user, levels ).getLevels() );
			}
		);

		router.post( '/',
			hub,
			( req, res, next ) => {
				return new MembershipClassEndpoint( req.hub, req.user, levels )
				.create( req.query.user, req.query.level )
				.then( cls => res.json( cls ) )
				.catch( err => next( err ) );
			}
		);

		router.put( '/:id(\\d+)',
			hub,
			( req, res, next ) => {
				return new MembershipClassEndpoint( req.hub, req.user, levels )
				.approve( req.params.id, req.query.level, req.body.note )
				.then( cls => res.json( cls ) )
				.catch( err => next( err ) );
			}
		);

		router.delete( '/:id(\\d+)',
			hub,
			( req, res, next ) => {
				return new MembershipClassEndpoint( req.hub, req.user )
				.remove( req.params.id, req.body.note )
				.then( cls => res.json( cls ) )
				.catch( err => next( err ) );
			}
		)

		return router;
	}

}

module.exports = MembershipClassEndpoint;
