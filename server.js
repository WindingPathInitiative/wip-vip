const express = require( 'express' );
const bodyParser = require( 'body-parser' );

const app = express();

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( require( 'express-partial-response' )() );
app.use( require( 'morgan' )( 'dev' ) );

app.use( '/v1/awards/', require( './endpoints/awards' ).route() );
app.use( '/v1/vip/', require( './endpoints/vip' ).route() );
app.use( '/v1/categories/', require( './endpoints/categories' ).route() );

app.get( '/', ( req, res ) => {
	let version = require( './package.json' ).version;
	res.json({
		message: 'Welcome to the prestige system!',
		version
	});
});

app.use( ( req, res, next ) => {
	var err = new Error( 'Not Found' );
	err.status = 404;
	next( err );
});

require( 'pretty-error' ).start();
app.use( ( err, req, res, next ) => { // eslint-disable-line no-unused-vars
	console.error( err.stack );
	res.status( err.status || 500 );
	res.json({
		message: err.message,
		status: err.status || 500
	});
});

let port = process.env.PORT || '3000';
app.set( 'port', port );

app.listen( port, () => {
	console.log( 'Listening on port', port );
});

module.exports = app;
