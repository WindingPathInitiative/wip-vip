'use strict';

const validate = require( 'validate.js' );
const Promise  = require( 'bluebird' );
const _        = require( 'lodash' );

validate.Promise = Promise;

validate.options = { format: 'flat' };

let types = [ 'String', 'Array', 'Boolean', 'Object', 'Number' ];

types.forEach( type => {
	let name = 'is' + type;
	validate.validators[ name ] = val => {
		return new Promise( res => {
			if ( undefined === val || _[ name ]( val ) ) {
				res();
			} else {
				res( 'not expected type' );
			}
		});
	};
});

validate.extend( validate.validators.datetime, {
	parse: ( value ) => Date.parse( value ),
	format: ( value ) => new Date( value )
});

module.exports = validate;

/**
 * Normalizes a boolean query value.
 * @param {mixed} boolean Value to parse.
 * @return {boolean}
 */
module.exports.normalizeBool = function( boolean ) {
	if ( 'true' === boolean || '1' === boolean || true === boolean ) {
		return true;
	} else {
		return false;
	}
};
