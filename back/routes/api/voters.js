var router = require('express').Router();

router.get('/new_voted', function(req, res)
{
	var eosapp = req.app.get('eosapp');
	var bpAccount = req.query.bp_account;
	if (bpAccount == null)
	{
		res.sendStatus(404);
	}
	else
	{
		res.json({ accounts: eosapp.getNewVoted(bpAccount) });
	}
});

router.get('/new_unvoted', function(req, res)
{
	var eosapp = req.app.get('eosapp');
	var bpAccount = req.query.bp_account;
	if (bpAccount == null)
	{
		res.sendStatus(404);
	}
	else
	{
		res.json({ accounts: eosapp.getNewUnvoted(bpAccount) });
	}
});

router.put('/new_voted', function(req, res)
{
	var eosapp = req.app.get('eosapp');
	var bpAccount = req.query.bp_account;
	if (bpAccount == null)
	{
		res.sendStatus(404);
	}
	else
	{
		//TODO: check req.body.accounts
		eosapp.addLocalNewVoted(bpAccount, req.body.accounts)
			.then(() => res.sendStatus(200))
			.catch(() => res.sendStatus(500));
	}
});

router.put('/new_unvoted', function(req, res)
{
	var eosapp = req.app.get('eosapp');
	var bpAccount = req.query.bp_account;
	if (bpAccount == null)
	{
		res.sendStatus(404);
	}
	else
	{
		//TODO: check req.body.accounts
		eosapp.removeLocalUnvoted(bpAccount, req.body.accounts)
			.then(() => res.sendStatus(200))
			.catch(() => res.sendStatus(500));
	}
});

module.exports = router;