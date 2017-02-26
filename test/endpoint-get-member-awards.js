'use strict';

/* eslint-env node, mocha */

const should  = require( 'should' ); // eslint-disable-line no-unused-vars

const hub = require( './helpers' ).hub;
const Award = require( '../models/award' );
const GetMemberAwards = require( '../endpoints/get-member-awards' );

module.exports = function() {
	it( 'constructs correctly', function() {
		let instance = new GetMemberAwards( Award, hub );
		instance.should.be.an.instanceOf( GetMemberAwards );
		instance.should.have.properties({
			Award: Award,
			Hub: hub
		});
	});

	it( 'gets member awards', function( done ) {
		let instance = new GetMemberAwards( Award, hub() );
		instance.get( 1 ).then( awards => {
			awards.should.be.an.Array().and.have.length( 2 );
			awards.forEach( award => {
				award.should.have.properties({
					user: 1,
					status: 'Awarded'
				});
				award.should.have.properties([
					'id', 'description', 'source', 'date', 'modified',
					'nominate', 'awarder', 'general', 'regional',
					'national', 'usableGeneral', 'usableRegional', 'usableNational', 'vip'
				]);
				award.should.have.property( 'category' ).have.properties([
					'name', 'totalLimit', 'entryLimit'
				]);
			});
			done();
		});
	});
}
