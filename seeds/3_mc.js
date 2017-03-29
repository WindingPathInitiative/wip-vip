
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
		{
			id: 2,
			user: 2,
			date: new Date( '2017-02-30' ),
			level: 2,
			general: 100,
			regional: 0,
			national: 0,
			status: 'Requested',
			currentLevel: 'Domain',
			office: 8
		},
		{
			id: 3,
			user: 2,
			date: new Date( '2017-02-30' ),
			level: 10,
			general: 0,
			regional: 0,
			national: 0,
			status: 'Removed',
			currentLevel: 'Regional',
			office: 0
		}
	]) );
};
