
exports.seed = function( knex ) {
	return knex( 'actions' ).del()
	.then( () => knex( 'actions' ).insert([
		{ id: 1, awardId: 1, office: 1, user: 8, action: 'Awarded' },
		{ id: 2, awardId: 2, office: 1, user: 8, action: 'Awarded' },
		{ id: 3, awardId: 4, office: 1, user: 8, action: 'Awarded' },
		{ id: 4, awardId: 6, office: 1, user: 8, action: 'Awarded' },
		{ id: 5, awardId: 8, office: 1, user: 8, action: 'Awarded' }
	]) );
};
