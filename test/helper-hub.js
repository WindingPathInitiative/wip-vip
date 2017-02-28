/* eslint-env node, mocha */

const should  = require( 'should' ); // eslint-disable-line no-unused-vars

const Hub = require( '../helpers/hub' );
const hub = require( './helpers' ).hub;

module.exports = function() {
	it( 'constructs correctly', function() {
		hub().should.be.a.instanceOf( Hub );
		hub().should.have.properties({
			baseUrl: 'base',
			token: 'token'
		});
	});

	it( 'requests from the API', function( done ) {
		hub().request( '/v1/test' ).should.be.a.Promise().and.be.fulfilled();
		hub().request( '/v1/test' ).then( body => {
			body.should.have.property( 'message', 'Success' );
			body.should.have.property( 'token', 'token' );
			done();
		});
	});

	it( 'throws an error for an invalid status', function( done ) {
		hub( 400 ).request( '/v1/test' ).should.be.a.Promise().and.be.rejected();
		hub( 400 ).request( '/v1/test' ).catch( err => {
			err.should.be.an.Error();
			err.should.have.property( 'name', 'AuthError' );
			err.should.have.property( 'status', 403 );
			done();
		});
	});

	describe( 'hasOverUser', function() {
		it( 'returns true on success', function() {
			hub().hasOverUser( 1 ).should.be.a.Promise().and.is.fulfilledWith( true );
		});

		it( 'returns false on failure', function() {
			hub( 403 ).hasOverUser( 1 ).should.be.a.Promise().and.is.rejected();
		});
	});
}
