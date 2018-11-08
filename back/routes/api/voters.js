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

router.get('/new_voted_count', function(req, res)
{
	var eosapp = req.app.get('eosapp');
	var bpAccount = req.query.bp_account;
	if (bpAccount == null)
	{
		res.sendStatus(404);
	}
	else
	{
		var newVoted = eosapp.getNewVoted(bpAccount);
		res.json({ count: newVoted.length });
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

router.get('/new_unvoted_count', function(req, res)
{
	var eosapp = req.app.get('eosapp');
	var bpAccount = req.query.bp_account;
	if (bpAccount == null)
	{
		res.sendStatus(404);
	}
	else
	{
		var newUnvoted = eosapp.getNewUnvoted(bpAccount);
		res.json({ count: newUnvoted.length });
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
		eosapp.markLocalVoted(bpAccount, req.body.accounts)
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
		eosapp.markLocalUnvoted(bpAccount, req.body.accounts)
			.then(() => res.sendStatus(200))
			.catch(() => res.sendStatus(500));
	}
});

module.exports = router;