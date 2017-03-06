/**
 * Membership Class migrations.
 */

exports.up = function( knex ) {
	return knex.schema.createTable( 'mc', table => {
		table.increments();
		table.integer( 'user' ).index().notNullable();
		table.date( 'date' ).index().notNullable();
		table.integer( 'level' ).index().notNullable();
		table.integer( 'general' ).notNullable();
		table.integer( 'regional' ).notNullable();
		table.integer( 'national' ).notNullable();
		table.enum( 'status', [ 'Requested', 'Reviewing', 'Approved', 'Removed' ] ).defaultTo( 'Requested' ).index().notNullable();
		table.enum( 'currentLevel', [ 'Domain', 'Regional', 'National' ] ).notNullable();
		table.integer( 'office' ).index().notNullable();
	});
};

exports.down = function( knex ) {
	return knex.schema.dropTable( 'mc' );
};
