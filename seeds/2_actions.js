
exports.seed = function( knex ) {
	return knex( 'actions' ).del()
	.then( () => knex( 'actions' ).insert([
		{ id: 1, awardId: 1, office: 1, user: 1, action: 'Awarded' },
		{ id: 2, awardId: 3, office: 1, user: 1, action: 'Awarded' }
	]) );
};
