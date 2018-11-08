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

	getTable(code, scope, table, lower_bound)
	{
		return this.eos.getTableRows({code: code,
	        scope: scope,
	        table: table,
	        lower_bound: lower_bound,
	        limit: 10000,
	        json: true});
	}

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

	getNewVoted(bp)
	{
		return this.cachedVoters.has(bp) ?
			this.cachedVoters.get(bp).newVoted :
			[];
	}

	getNewUnvoted(bp)
	{
		return this.cachedVoters.has(bp) ?
			this.cachedVoters.get(bp).newUnvoted :
			[];
	}

	findNewVoted(globalVoters, bp, cb)
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

	findNewUnvoted(globalVoters, bp, cb)
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
		return this.setLocalVoted(bp, newVoters);
	}

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
		return this.setLocalVoted(bp, newVoters);
	}

	setLocalVoted(bp, accounts)
	{
		return this.dbc.setBpVoters(bp, accounts)
			.catch(console.error);
	}

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
					{ newVoted: votedAccounts, newUnvoted: unvotedAccounts });
			}
			catch (e) {
				console.error(e);
			}
		}
		console.log(this.cachedVoters);
		setTimeout(() => { this.updateVoters() }, 30000);
	}
}

module.exports.EosApp = EosApp