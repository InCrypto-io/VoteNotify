var mysql = require('mysql');


const promisify = fn => (...args) => new Promise((resolve, reject) => {
	fn(...args, (error, value) => {
		if (error) {
			reject(error);
		} else {
			resolve(value);
		}
	});
});


class DBConnector
{
	constructor(config)
	{
		this.con = mysql.createConnection(config);
	}

	connect()
	{
		this.con.connect(function(err) {
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

	async checkVote(voter, bp)
	{
		const selectQuery = promisify(this.con.query);
		var sql = 'SELECT voter.account_name ' +
			'FROM voter INNER JOIN block_producer ON voter.id_bp = block_producer.id ' +
			'WHERE block_producer.account_name = \'' + bp + '\' and ' +
			'voter.account_name = \'' + voter + '\';';
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