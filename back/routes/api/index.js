var router = require('express').Router();

router.use('/voters', require('./voters'));

module.exports = router;