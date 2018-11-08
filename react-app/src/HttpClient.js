const fetch = require('node-fetch');


class HttpClient
{
	constructor(config)
	{
		this.host = config.host;
		this.port = config.port;
	}

	getNewVoted(bp)
	{
		var url = 'http://' + this.host + ':' + this.port +
			'/api/voters/new_voted?bp_account=' + bp;
		return fetch(url,
			{
				method: 'GET',
				mode: 'cors'
			})
			.then(response => response.json());
	}

	getNewUnvoted(bp)
	{
		var url = 'http://' + this.host + ':' + this.port +
			'/api/voters/new_unvoted?bp_account=' + bp;
		return fetch(url,
			{
				method: 'GET',
				mode: 'cors'
			})
			.then(response => response.json());
	}

	putNewVoted(bp, accounts)
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
			});
	}

	putNewUnvoted(bp, accounts)
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
			});
	}
}

export default HttpClient