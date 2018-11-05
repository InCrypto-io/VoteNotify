var router = require('express').Router();

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
	var sql = 'SELECT voter.account_name FROM voter INNER JOIN block_producer '
		'WHERE block_producer.account_name = ' + bp;
	con.query(sql, function (err, result, fields)
	{
		if (err) throw err;
		cb(result);
	});
}

function findNewVoted(voters, bp, cb)
{
	getBpVoters(bp, (result) =>
	{
		var str = JSON.stringify(result);
		var bpVoters = JSON.parse(str);

		var voted = [];
		for (var i = 0; i < voters.length; i++)
		{
			//TODO: implement
		}
	});
}

function findNewUnvoted(voters, bp, cb)
{
	getBpVoters(bp, (result) =>
	{
		var str = JSON.stringify(result);
		var bpVoters = JSON.parse(str);

		var unvoted = [];
		for (var i = 0; i < bpVoters.length; i++)
		{
			var voter = voters.find((el, idx, arr) =>
			{
				return el.owner == bpVoters[i].account_name;
			});
			if (voter === undefined || //TODO: there shouldn`t be any undefined
				voter.producers.find((el, idx, arr) =>
				{
					el == bpVoters[i].account_name;
				}) === undefined)
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
				findNewUnvoted(voters, bpAccount, (accounts) => {res.send(accounts)});
			});
		//findNewVoted
		//findNewUnvoted

		/*eosapp.getNewVoted(systemContractAcc)
			.then(console.log);*/
	}
});

module.exports = router;