var Eos = require('eosjs');
const DBConnector = require('./DBConnector');


class EosApp
{
	constructor(config)
	{
		this.systemContractAcc = config.eos.systemContractAcc;
		this.systemVotersTable = config.eos.systemVotersTable;
		var httpEndpoint = config.eos.httpEndpoint;
		var chainId = config.eos.chainId;
		this.eos = Eos({ httpEndpoint, chainId });
		this.cachedVoters = new Map();
		this.dbc = new DBConnector.DBConnector(config.db);
		this.dbc.connect();
	}

	/** @return {Promise} returns rows from table starting from lower_bound */
	getTable(code, scope, table, lower_bound)
	{
		return this.eos.getTableRows({code: code,
	        scope: scope,
	        table: table,
	        lower_bound: lower_bound,
	        limit: 10000,
	        json: true});
	}

	/** @return {Promise} returns the whole voters table */
	async getVoters()
	{
		var voters = [];
		var lower_bound = 0;
		var data = await this.getTable(this.systemContractAcc, this.systemContractAcc,
			this.systemVotersTable, lower_bound);
		while (data.more)
		{
			voters = voters.concat(data.rows);
			lower_bound = voters[voters.length - 1].owner;
			data = await this.getTable(this.systemContractAcc, this.systemContractAcc,
				this.systemVotersTable, lower_bound);
		}
		return voters;
	}

	/**
	* @param {string} bp Account of block producer to check voters for
	* @return {array} returns new voted accounts for block producer if it is in database
	*     otherwise returns empty list
	*/
	getNewVoted(bp)
	{
		return this.cachedVoters.has(bp) ?
			this.cachedVoters.get(bp).newVoters :
			[];
	}

	/**
	* @param {string} bp Account of block producer to check voters for
	* @return {array} returns new unvoted accounts for block producer if it is in database
	*     otherwise returns empty list
	*/
	getNewUnvoted(bp)
	{
		return this.cachedVoters.has(bp) ?
			this.cachedVoters.get(bp).newUnvoters :
			[];
	}

	/**
	* Compares local information about voters with given voters table
	* and returns changes between them
	* @param {array} globalVoters Eos 'voters' table
	* @param {string} bp Account of block producer to check voters for
	* @return {Promise} returns all voters
	*     who is present in globalVoters but not present in local voter table
	*/
	findNewVoted(globalVoters, bp)
	{
		 return this.dbc.getBpVoters(bp)
			.then(async (result) =>
		{
			var str = JSON.stringify(result);
			var bpVoters = JSON.parse(str);

			var voted = [];
			for (var i = 0; i < globalVoters.length; i++)
			{
				var idx = globalVoters[i].producers.indexOf(bp);
				if (idx != -1) //voter has vote for this bp in global table
				{
					//if local db isn`t syncronized on this voter
					//add him to voted list
					if (!(await this.dbc.checkVote(globalVoters[i].owner, bp)))
					{
						voted.push(globalVoters[i].owner);
					}
				}
			}
			return voted;
		});
	}

	/**
	* Compares local information about voters with given voters table
	* and returns changes between them
	* @param {array} globalVoters Eos 'voters' table
	* @param {string} bp Account of block producer to check voters for
	* @return {Promise} returns all voters
	*     who is present in local voter table but not present in globalVoters
	*/
	findNewUnvoted(globalVoters, bp)
	{
		return this.dbc.getBpVoters(bp)
			.then((result) =>
		{
			var str = JSON.stringify(result);
			var bpVoters = JSON.parse(str);

			var unvoted = [];
			for (var i = 0; i < bpVoters.length; i++)
			{
				var voter = globalVoters.find((el, idx, arr) =>
				{
					return el.owner == bpVoters[i].account_name;
				});
				//votes is in db but is not in global table
				if (voter === undefined)
				{
					this.dbc.removeVoter(bpVoters[i].account_name, bp);
				}
				//voter is recorded in local db as voted
				//but in global table he has no vote for this bp
				else if (voter.producers.indexOf(bp) == -1)
				{
					unvoted.push(bpVoters[i].account_name);
				}
			}
			return unvoted;
		});
	}

	/**
	* Mark accounts that recently voted for bp as notified
	* @param {string} bp Account of block producer to mark voters for
	* @param {array} accounts Accounts to mark
	*/
	async markLocalVoted(bp, accounts)
	{
		var voters = await this.dbc.getBpVoters(bp);
		var str = JSON.stringify(voters);
		var objects = JSON.parse(str);
		var newVoters = [];
		for (var i = 0; i < objects.length; i++)
		{
			newVoters.push(objects[i].account_name);
		}
		for (var i = 0; i < accounts.length; i++)
		{
			if (newVoters.indexOf(accounts[i]) == -1)
			{
				newVoters.push(accounts[i]);
			}
		}
		await this.setLocalVoted(bp, newVoters);
		//update cached voters
		if (this.cachedVoters.has(bp))
		{
			var newCachedVoters = this.cachedVoters.get(bp);
			newCachedVoters.newVoters = newCachedVoters.newVoters.filter(e =>
			{
				return accounts.indexOf(e) == -1;
			});
			this.cachedVoters.set(bp, newCachedVoters);
			console.log(this.cachedVoters);
		}
	}

	/**
	* Mark accounts that recently unvoted for bp as notified
	* @param {string} bp Account of block producer to mark voters for
	* @param {array} accounts Accounts to mark
	*/
	async markLocalUnvoted(bp, accounts)
	{
		var voters = await this.dbc.getBpVoters(bp);
		var str = JSON.stringify(voters);
		var objects = JSON.parse(str);
		var newVoters = [];
		for (var i = 0; i < objects.length; i++)
		{
			newVoters.push(objects[i].account_name);
		}
		newVoters = newVoters.filter(e =>
			{
				return accounts.indexOf(e) == -1;
			});
		await this.setLocalVoted(bp, newVoters);
		//update cached voters
		if (this.cachedVoters.has(bp))
		{
			var newCachedVoters = this.cachedVoters.get(bp);
			newCachedVoters.newUnvoters = newCachedVoters.newUnvoters.filter(e =>
			{
				return accounts.indexOf(e) == -1;
			});
			this.cachedVoters.set(bp, newCachedVoters);
			console.log(this.cachedVoters);
		}
	}

	setLocalVoted(bp, accounts)
	{
		return this.dbc.setBpVoters(bp, accounts)
			.catch(console.error);
	}

	/**
	* Gets voters from eos table and checks if there are changes
	*     comparing to local table of voters.
	*     After that runs itself on timer.
	*/
	async updateVoters()
	{
		var voters = []
		var blockProducers = []
		try {
			voters = await this.getVoters();
			blockProducers = await this.dbc.getBlockProducers();
		}
		catch (e) {
			console.log(e);
		}
		for (var i = 0; i < blockProducers.length; i++)
		{
			var bp = blockProducers[i];
			try {
				var unvotedAccounts = await this.findNewUnvoted(voters, bp.account_name);
				var votedAccounts = await this.findNewVoted(voters, bp.account_name);
				this.cachedVoters.set(bp.account_name,
					{ newVoters: votedAccounts, newUnvoters: unvotedAccounts });
			}
			catch (e) {
				console.error(e);
			}
		}
		console.log(this.cachedVoters);
		setTimeout(() => { this.updateVoters() }, 60000);
	}
}

module.exports.EosApp = EosApp