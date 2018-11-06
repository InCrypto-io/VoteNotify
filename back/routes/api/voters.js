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
		res.send(eosapp.getNewVoted(bpAccount));
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
		res.send(eosapp.getNewUnvoted(bpAccount));
	}
});

module.exports = router;