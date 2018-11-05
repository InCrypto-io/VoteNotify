const EosApp = require ('./EosApp');
var express = require('express');

var eosapp = new EosApp.EosApp();

var app = express();
app.set('eosapp', eosapp);
app.use(require('./routes'));
app.listen(3001, function () {
  console.log('Example app listening on port 3001!');
});