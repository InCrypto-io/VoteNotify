const EosApp = require ('./EosApp');
var express = require('express');
var cors = require('cors');

var eosapp = new EosApp.EosApp();
setTimeout(() => { eosapp.updateVoters() }, 500);

var app = express();
app.set('eosapp', eosapp);
app.use(express.json());
app.use(cors());
app.use(require('./routes'));
app.listen(3001, function () {
  console.log('Example app listening on port 3001!');
});