
exports.seed = function( knex ) {
	return knex( 'awards' ).del()
	.then( () => knex( 'categories' ).del() )
	.then( () => knex( 'categories' ).insert([
		{ id: 1, name: 'Officer', start: new Date( '2018-01-01' ), type: 'vip' },
		{ id: 2, name: 'Game Assistance', start: new Date( '2018-01-01' ), type: 'vip' },
		{ id: 3, name: 'Chapter Assistance', start: new Date( '2018-01-01' ), type: 'vip' },
		{ id: 4, name: 'Club Assistance', start: new Date( '2018-01-01' ), type: 'vip' },
	]) );
};
