class GetMemberAwards {
	constructor( awards, hub ) {
		this.Awards = awards;
		this.Hub = hub;
		return this;
	}

	get( user, status ) {
		if ( ! status ) {
			status = 'Awarded';
		}

		return this.Hub.hasOverUser( user )
		.then( approved => {
			if ( ! approved ) {
				throw new Error();
			}
			return this.Awards.where({
				user: user,
				status: status
			}).fetchAll({
				withRelated: [ 'category' ]
			})
		})
		.then( awards => awards.toJSON() );
	}
}

module.exports = GetMemberAwards;
