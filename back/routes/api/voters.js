var router = require('express').Router();


const promisify = fn => (...args) => new Promise((resolve, reject) => {
	fn(...args, (error, value) => {
		if (error) {
			reject(error);
		} else {
			resolve(value);
		}
	});
});


//***************************TODO: put it to separate module
var mysql = require('mysql');


var con = mysql.createConnection({
	host: "localhost",
	user: "vadim",
	password: "Incryptowetrust",
	database: "EOS_voters"
});

con.connect(function(err) {
	if (err) throw err;
	console.log("Connected!");
});


function getBpVoters(bp, cb)
{
	var sql = 'SELECT voter.account_name ' +
		'FROM voter INNER JOIN block_producer ON voter.id_bp = block_producer.id ' +
		'WHERE block_producer.account_name = \'' + bp + '\';';
	con.query(sql, function (err, result, fields)
	{
		if (err) throw err;
		cb(result);
	});
}

async function checkVote(voter, bp)
{
	const selectQuery = promisify(con.query);
	var sql = 'SELECT voter.account_name ' +
		'FROM voter INNER JOIN block_producer ON voter.id_bp = block_producer.id ' +
		'WHERE block_producer.account_name = \'' + bp + '\' and ' +
		'voter.account_name = \'' + voter + '\';';
	var result = await selectQuery(sql);
	return result.length > 0;
}

function removeVoter(voter, bp)
{
	var sql = 'DELETE v FROM voter v INNER JOIN block_producer ON v.id_bp = block_producer.id ' +
		'WHERE v.account_name = \'' + voter + '\' and ' +
		'block_producer.account_name = \'' + bp + '\';';
	con.query(sql, function (err, result, fields)
	{
		if (err) throw err;
	});
}

function findNewVoted(globalVoters, bp, cb)
{
	getBpVoters(bp, async (result) =>
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
				if (!(await checkVote(globalVoters[i].owner, bp)))
				{
					voted.push(globalVoters[i].owner);
				}
			}
		}
		cb(voted);
	});
}

function findNewUnvoted(globalVoters, bp, cb)
{
	getBpVoters(bp, (result) =>
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
				removeVoter(voter, bp);
			}
			//voter is recorded in local db as voted
			//but in global table he has no vote for this bp
			else if (voter.producers.indexOf(bpVoters[i].account_name) == -1)
			{
				unvoted.push(bpVoters[i].account_name);
			}
		}
		cb(unvoted);
	});
}
//*********************************************************

router.get('/new_voted', function(req, res)
{
	var eosapp = req.app.get('eosapp');
	var systemContractAcc = req.query.system_contract_account;
	var bpAccount = req.query.bp_account;
	if (systemContractAcc == null || bpAccount == null)
	{
		res.sendStatus(404);
	}
	else
	{
		eosapp.getVoters(systemContractAcc)
			.then((voters) =>
			{
				findNewVoted(voters, bpAccount, (accounts) => {res.send(accounts)});
			});
	}
});

router.get('/new_unvoted', function(req, res)
{
	var eosapp = req.app.get('eosapp');
	var systemContractAcc = req.query.system_contract_account;
	var bpAccount = req.query.bp_account;
	if (systemContractAcc == null || bpAccount == null)
	{
		res.sendStatus(404);
	}
	else
	{
		eosapp.getVoters(systemContractAcc)
			.then((voters) =>
			{
				findNewUnvoted(voters, bpAccount, (accounts) => {res.send(accounts)});
			});
	}
});

module.exports = router;