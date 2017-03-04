
exports.seed = function( knex ) {
	return knex( 'awards' ).del()
	.then( () => knex( 'awards' ).insert([
		{ id: 1, user: 1, categoryId: 1, date: new Date( '2017-02-20' ), general: 50, status: 'Awarded' },
		{ id: 2, user: 1, categoryId: 2, date: new Date( '2017-02-24' ), general: 35, status: 'Awarded' },
		{ id: 3, user: 1, categoryId: 1, date: new Date( '2017-02-24' ), general: 50, status: 'Requested' },
		{ id: 4, user: 2, categoryId: 1, date: new Date( '2017-02-28' ), regional: 10, status: 'Awarded' }
	]) );
};
