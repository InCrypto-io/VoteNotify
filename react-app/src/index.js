import React from 'react';
import ReactDOM from 'react-dom';
import EosApp from './EosApp'
import App from './App';

var eosapp = new EosApp();

ReactDOM.render(<App eosapp={eosapp} />, document.getElementById('root'));
