const fetch = require('node-fetch');


class HttpClient
{
	constructor(config)
	{
		this.host = config.host;
		this.port = config.port;
	}

	getNewVoted = (bp) =>
	{
		var url = 'http://' + this.host + ':' + this.port +
			'/api/voters/new_voted?bp_account=' + bp;
		return fetch(url,
			{
				method: 'GET',
				mode: 'cors'
			})
			.then(function(response) {
				if (!response.ok) {
					throw Error(response.statusText);
				}
				return response;
			})
			.then(response => response.json());
	}

	getNewVotedCount = (bp) =>
	{
		var url = 'http://' + this.host + ':' + this.port +
			'/api/voters/new_voted_count?bp_account=' + bp;
		return fetch(url,
			{
				method: 'GET',
				mode: 'cors'
			})
			.then(function(response) {
				if (!response.ok) {
					throw Error(response.statusText);
				}
				return response;
			})
			.then(response => response.json());
	}

	getNewUnvoted = (bp) =>
	{
		var url = 'http://' + this.host + ':' + this.port +
			'/api/voters/new_unvoted?bp_account=' + bp;
		return fetch(url,
			{
				method: 'GET',
				mode: 'cors'
			})
			.then(function(response) {
				if (!response.ok) {
					throw Error(response.statusText);
				}
				return response;
			})
			.then(response => response.json());
	}

	getNewUnvotedCount = (bp) =>
	{
		var url = 'http://' + this.host + ':' + this.port +
			'/api/voters/new_unvoted_count?bp_account=' + bp;
		return fetch(url,
			{
				method: 'GET',
				mode: 'cors'
			})
			.then(function(response) {
				if (!response.ok) {
					throw Error(response.statusText);
				}
				return response;
			})
			.then(response => response.json());
	}

	putNewVoted = (bp, accounts) =>
	{
		var url = 'http://' + this.host + ':' + this.port +
			'/api/voters/new_voted?bp_account=' + bp;
		return fetch(url,
			{
				method: 'PUT',
				headers: {
					"Content-Type": "application/json; charset=utf-8"
				},
				body: JSON.stringify({ accounts: accounts }),
				mode: 'cors'
			})
			.then(function(response) {
				if (!response.ok) {
					throw Error(response.statusText);
				}
				return response;
			});
	}

	putNewUnvoted = (bp, accounts) =>
	{
		var url = 'http://' + this.host + ':' + this.port +
			'/api/voters/new_unvoted?bp_account=' + bp;
		return fetch(url,
			{
				method: 'PUT',
				headers: {
					"Content-Type": "application/json; charset=utf-8"
				},
				body: JSON.stringify({ accounts: accounts }),
				mode: 'cors'
			})
			.then(function(response) {
				if (!response.ok) {
					throw Error(response.statusText);
				}
				return response;
			});
	}
}

export default HttpClient