var Eos = require('eosjs');


const httpEndpoint = "http://dev.cryptolions.io:38888";
const chainId = '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca';

class EosApp
{
	constructor()
	{
		this.eos = Eos({httpEndpoint, chainId});
	}

	getTable(code, scope, table, lower_bound)
	{
		return this.eos.getTableRows({code: code,
	        scope: scope,
	        table: table,
	        //table_key: table_key,
	        lower_bound: lower_bound,
	        limit: 10000,
	        json: true});
	}

	async getVoters(systemContractAcc)
	{
		var voters = []
		var lower_bound = 0;
		var data = await this.getTable(systemContractAcc, systemContractAcc,
			'voters', lower_bound);
		while (data.more)
		{
			console.log(data.rows[0]);
			voters = voters.concat(data.rows);
			lower_bound = voters[voters.length - 1].owner;
			data = await this.getTable(systemContractAcc, systemContractAcc,
				'voters', lower_bound);
		}
		return voters;
	}
}

module.exports.EosApp = EosApp