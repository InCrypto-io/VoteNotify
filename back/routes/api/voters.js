var router = require('express').Router();

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
				eosapp.findNewVoted(voters, bpAccount,
					(accounts) => { res.send(accounts) });
			})
			.catch((err) => { res.sendStatus(500) });
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
				eosapp.findNewUnvoted(voters, bpAccount,
					(accounts) => { res.send(accounts) });
			})
			.catch((err) => { res.sendStatus(500) });
	}
});

module.exports = router;