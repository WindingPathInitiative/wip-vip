
exports.seed = function( knex ) {
	return knex( 'awards' ).del()
	.then( () => knex( 'awards' ).insert([
		{ id: 1, user: 1, categoryId: 1, date: new Date( '2017-02-20' ), general: 50, usableGeneral: 50, status: 'Awarded' },
		{ id: 2, user: 1, categoryId: 2, date: new Date( '2017-02-24' ), general: 35, usableGeneral: 30, status: 'Awarded' },
		{ id: 3, user: 1, categoryId: 1, date: new Date( '2017-02-24' ), general: 50, usableGeneral: 50, status: 'Requested' },
		{ id: 4, user: 2, categoryId: 1, date: new Date( '2017-02-28' ), regional: 10, usableRegional: 10, status: 'Awarded' },
		{ id: 5, user: 2, categoryId: 1, date: new Date( '2017-02-28' ), national: 10, usableNational: 10, status: 'Removed' },
		{ id: 6, user: 1, categoryId: 6, date: new Date( '2017-02-20' ), vip: 2, status: 'Awarded' },
		{ id: 7, user: 1, categoryId: 6, date: new Date( '2017-02-24' ), vip: 2, status: 'Requested' },
		{ id: 8, user: 2, categoryId: 6, date: new Date( '2017-02-28' ), vip: 2, status: 'Awarded' },
		{ id: 9, user: 2, categoryId: 6, date: new Date( '2017-02-28' ), vip: 2, status: 'Removed' },
	]) );
};
