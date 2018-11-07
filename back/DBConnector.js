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

	async getBpId(bp)
	{
		var sql = 'SELECT id FROM block_producer WHERE account_name = \'' + bp + '\';';
		console.log(sql);
		const selectQuery = sql => new Promise((resolve, reject) =>
		{
			this.con.query(sql, function (err, result, fields)
			{
				if (err) reject(err);
				resolve(result);
			})
		});
		var result = await selectQuery(sql);
		var str = JSON.stringify(result);
		return JSON.parse(str)[0].id;
	}

	getBpVoters(bp)
	{
		var sql = 'SELECT voter.account_name ' +
			'FROM voter INNER JOIN block_producer ON voter.id_bp = block_producer.id ' +
			'WHERE block_producer.account_name = \'' + bp + '\';';
		const selectQuery = sql => new Promise((resolve, reject) =>
		{
			this.con.query(sql, function (err, result, fields)
			{
				if (err) reject(err);
				resolve(result);
			})
		});
		return selectQuery(sql);
	}

	async setBpVoters(bp, voters)
	{
		var bpId = await this.getBpId(bp);
		const transaction = () => new Promise((resolve, reject) =>
		{
			this.con.beginTransaction((err) =>
			{
				if (err) reject(err);
				var sql = 'DELETE FROM voter WHERE id_bp = ' + bpId + ';';
				this.con.query(sql, async (err) =>
				{
					if (err)
					{
						this.con.rollback(() => reject(err));
					}

					for (var i = 0; i < voters.length; i++)
					{
						try {
							await this.insertVoterByBpId(voters[i], bpId);
						}
						catch (err) {
							this.con.rollback(() => reject(err));
						}
					}
					this.con.commit((err) => {
						if (err) { 
							this.con.rollback(() => reject(err));
						}
						console.log('Transaction Complete.');
						resolve();
					});
				})
			});
		});
		return transaction();
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

	insertVoterByBpId(voter, bpId)
	{
		var sql = 'INSERT INTO voter (id_bp, account_name) ' +
			'VALUES(' + bpId + ', \'' + voter + '\');';
		console.log(sql);
		const insertQuery = sql => new Promise((resolve, reject) =>
		{
			this.con.query(sql, function (err, result, fields)
			{
				if (err) reject(err);
				resolve(result);
			});
		});
		return insertQuery(sql);
	}

	removeVoter(voter, bp)
	{
		var sql = 'DELETE v FROM voter v INNER JOIN block_producer ' +
			'ON v.id_bp = block_producer.id ' +
			'WHERE v.account_name = \'' + voter + '\' and ' +
			'block_producer.account_name = \'' + bp + '\';';
		console.log(sql);
		this.con.query(sql, function (err, result, fields)
		{
			if (err) throw err;
		});
	}
}

module.exports.DBConnector = DBConnector