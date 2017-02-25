/**
 * Awards migrations.
 */

exports.up = function( knex ) {
	return knex.schema.createTable( 'awards', table => {
		table.increments();
		table.integer( 'user' ).index().notNullable();
		table.string( 'description' );
		table.string( 'source' );
		table.integer( 'categoryId' ).index().notNullable();
		table.date( 'date' ).index().notNullable();
		table.timestamp( 'modified' ).defaultTo( knex.fn.now() ).notNullable();
		table.integer( 'nominate' ).index();
		table.integer( 'awarder' ).index();
		table.integer( 'documentId' ).index();
		table.integer( 'mcReviewId' ).index();
		table.enum( 'status', [ 'Requested', 'Nominated', 'Awarded', 'Denied' ] ).index().notNullable().defaultTo( 'Requested' );
		table.integer( 'general' ).defaultTo( 0 );
		table.integer( 'regional' ).defaultTo( 0 );
		table.integer( 'national' ).defaultTo( 0 );
		table.integer( 'usableGeneral' ).defaultTo( 0 );
		table.integer( 'usableRegional' ).defaultTo( 0 );
		table.integer( 'usableNational' ).defaultTo( 0 );
		table.integer( 'vip' ).defaultTo( 0 );
	});
};

exports.down = function( knex ) {
	return knex.schema.dropTable( 'awards' );
};
