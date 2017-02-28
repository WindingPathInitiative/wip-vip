module.exports = {

	development: {
		client: 'mysql',
		connection: {
			host:     '127.0.0.1',
			user:     'root',
			password: 'root',
			database: 'prestige'
		},
		debug: true
	},

	testing: {
		client: 'sqlite3',
		connection: {
			filename: ':memory:'
		},
		useNullAsDefault: true
	},

	staging: {
		client: 'mysql',
		connection: {
			host:     process.env.DB_HOST,
			user:     process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME
		},
		pool: {
			min: 2,
			max: 10
		}
	},

	production: {
		client: 'mysql',
		connection: {
			host:     process.env.DB_HOST,
			user:     process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME
		},
		pool: {
			min: 2,
			max: 10
		}
	}

};
