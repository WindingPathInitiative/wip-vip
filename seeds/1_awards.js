
exports.seed = function( knex ) {
	return knex( 'awards' ).del()
	.then( () => knex( 'awards' ).insert([
		{ id: 1, user: 1, categoryId: 1, date: new Date( '2018-02-20' ), vip: 2, usableVip: 2, status: 'Awarded' },
		{ id: 2, user: 1, categoryId: 2, date: new Date( '2018-02-24' ), vip: 2, usableVip: 2, status: 'Requested' },
		{ id: 3, user: 1, categoryId: 3, date: new Date( '2018-02-28' ), vip: 2, usableVip: 2, status: 'Awarded' },
		{ id: 4, user: 1, categoryId: 4, date: new Date( '2018-02-28' ), vip: 2, usableVip: 2, status: 'Removed' },
	]) );
};
