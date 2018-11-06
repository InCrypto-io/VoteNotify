var mysql = require('mysql');


class DBConnector
{
	constructor(config)
	{
		this.con = mysql.createConnection(config);
	}

	connect()
	{
		this.con.connect((err) => {
			if (err) throw err;
			console.log("Connected!");
		});
	}

	getBpVoters(bp, cb)
	{
		var sql = 'SELECT voter.account_name ' +
			'FROM voter INNER JOIN block_producer ON voter.id_bp = block_producer.id ' +
			'WHERE block_producer.account_name = \'' + bp + '\';';
		this.con.query(sql, function (err, result, fields)
		{
			if (err) throw err;
			cb(result);
		});
	}

	async getBlockProducers()
	{
		var sql = 'SELECT account_name FROM block_producer;';
		const selectQuery = sql => new Promise((resolve, reject) =>
		{
			this.con.query(sql, function (err, result, fields)
			{
				if (err) reject(err);
				resolve(result);
			});
		});
		var result = await selectQuery(sql);
		var str = JSON.stringify(result);
		return JSON.parse(str);
	}

	async checkVote(voter, bp)
	{
		var sql = 'SELECT voter.account_name ' +
			'FROM voter INNER JOIN block_producer ON voter.id_bp = block_producer.id ' +
			'WHERE block_producer.account_name = \'' + bp + '\' and ' +
			'voter.account_name = \'' + voter + '\';';
		const selectQuery = sql => new Promise((resolve, reject) =>
		{
			this.con.query(sql, function (err, result, fields)
			{
				if (err) reject(err);
				resolve(result);
			});
		});
		var result = await selectQuery(sql);
		return result.length > 0;
	}

	removeVoter(voter, bp)
	{
		var sql = 'DELETE v FROM voter v INNER JOIN block_producer ON v.id_bp = block_producer.id ' +
			'WHERE v.account_name = \'' + voter + '\' and ' +
			'block_producer.account_name = \'' + bp + '\';';
		this.con.query(sql, function (err, result, fields)
		{
			if (err) throw err;
		});
	}
}

module.exports.DBConnector = DBConnector