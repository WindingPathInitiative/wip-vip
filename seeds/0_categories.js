
exports.seed = function( knex ) {
	return knex( 'awards' ).del()
	.then( () => knex( 'categories' ).del() )
	.then( () => knex( 'categories' ).insert([
		{ id: 1, name: 'Administration', totalLimit: 80, entryLimit: 50, start: new Date( '2013-06-01' ) },
		{ id: 2, name: 'Non-Administrative Game Support', totalLimit: 50, entryLimit: 30, start: new Date( '2013-06-01' ) },
		{ id: 3, name: 'Social/Non-Game Support', totalLimit: 50, entryLimit: 30, start: new Date( '2013-06-01' ) },
		{ id: 4, name: 'Convention Events', totalLimit: 100, start: new Date( '2013-06-01' ) },
		{ id: 5, name: 'Standards and Renewals', start: new Date( '2013-06-01' ) }
	]) );
};
