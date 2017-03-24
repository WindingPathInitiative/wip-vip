
exports.seed = function( knex ) {
	return knex( 'mc' ).del()
	.then( () => knex( 'mc' ).insert([
		{
			id: 1,
			user: 1,
			date: new Date( '2016-03-30' ),
			level: 14,
			general: 5203,
			regional: 803,
			national: 923,
			status: 'Approved',
			currentLevel: 'National',
			office: 8
		},
	]) );
};
