'use strict';

let env = process.env.NODE_ENV || 'development';

const config = {
	development: {
		hubUrl: 'http://localhost:3030'
	},
	testing: {
		hubUrl: ''
	},
	staging: {
		hubUrl: 'http://docker-stage.mes:3030'
	},
	production: {
		hubUrl: process.env.HUB_URL
	}
}

module.exports = config[ env ];
