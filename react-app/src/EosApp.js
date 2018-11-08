import Eos from 'eosjs';
import ScatterJS from 'scatterjs-core';
import ScatterEOS from 'scatterjs-plugin-eosjs';

ScatterJS.plugins( new ScatterEOS() );

/*const eosLocalNetwork = {
    blockchain:'eos',
    host:'localhost',
    port:8888,
    protocol:'http',
    chainId:'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f'
};

const eosJungleNetwork = {
    blockchain:'eos',
    host:'dev.cryptolions.io',
    port:38888,
    protocol:'http',
    chainId:'038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca'
};

const network = eosJungleNetwork;*/


class EosApp
{
	constructor(config)
	{
		this.network = config.eos;
		this.systemContractAcc = 'eosio';
		this.tokenContractAcc = 'eosio.token';
		this.contractAccName = 'myvotenotify'; //TODO set it to valid account name
		ScatterJS.scatter.connect("Put_Your_App_Name_Here").then(connected => {
		    // User does not have Scatter Desktop, Mobile or Classic installed.
		    if(!connected) return false;
		    console.log('Connected: ');
		    console.log(connected);

		    this.scatter = ScatterJS.scatter;
			this.eos = this.scatter.eos( this.network, Eos, {} );
		    window.ScatterJS = null;
		});
	}

	sendMemo(from, to, message)
	{
		return this.scatter.getIdentity({ accounts:[this.network] })
			.then((identity) =>
			{
				return this.eos.contract(this.tokenContractAcc)
					.then((contract) =>
					{
						console.log('From contract');
						return contract.transfer(from, to, "0.0001 EOS", message,
							{ authorization: [from] });
					});
			});
	}

	sendNotification(bpAccName, users, message, onSuccess, onError)
	{
		this.scatter.getIdentity({ accounts:[this.network] })
			.then((identity) =>
			{
				this.eos.contract(this.contractAccName)
					.then((contract) =>
					{
						contract.notifymany(bpAccName, users, message,
							{ authorization: [bpAccName] })
							.then(onSuccess)
							.catch(error =>
								{
									onError(error);
								});
					})
					.catch(onError);
			})
			.catch((error) =>
			{
				console.log('Error from getIdentity: ');
				console.error(error);
			});
	}
}

export default EosApp