import React from 'react';
import ReactDOM from 'react-dom';
import EosApp from './EosApp'
import HttpClient from './HttpClient'
import App from './App';
import config from './config.json';

var eosapp = new EosApp(config.eos);
var httpclient = new HttpClient(config.http);

ReactDOM.render(<App eosapp={eosapp} httpclient={httpclient} />,
	document.getElementById('root'));
