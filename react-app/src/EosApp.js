import Eos from 'eosjs';
import ScatterJS from 'scatterjs-core';
import ScatterEOS from 'scatterjs-plugin-eosjs';

ScatterJS.plugins( new ScatterEOS() );

const network = {
    blockchain:'eos',
    host:'localhost',
    port:8888,
    protocol:'http',
    chainId:'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f'
};


class EosApp
{
	constructor()
	{
		this.contractAccName = '' //TODO set it to valid account name
		ScatterJS.scatter.connect("Put_Your_App_Name_Here").then(connected => {
		    // User does not have Scatter Desktop, Mobile or Classic installed.
		    if(!connected) return false;
		    console.log('Connected: ');
		    console.log(connected);

		    this.scatter = ScatterJS.scatter;
			this.eos = this.scatter.eos( network, Eos, {} );
		    window.ScatterJS = null;
		});
	}

	sendVoted(bpAccName, message, onSuccess, onError)
	{
		this.scatter.getIdentity({ accounts:[network] })
			.then((identity) =>
			{
				this.eos.contract(this.contractAccName)
					.then((contract) =>
					{
						contract.notifynew(bpAccName, message)
							.then(onSuccess)
							.catch(onError);
					})
					.catch(onError);
			})
			.catch((error) =>
			{
				console.log('Error from getIdentity: ');
				console.error(error);
			});
	}

	sendUnvoted(bpAccName, message, onSuccess, onError)
	{
		this.scatter.getIdentity({ accounts:[network] })
			.then((identity) =>
			{
				this.eos.contract(this.contractAccName)
					.then((contract) =>
					{
						contract.notifygone(bpAccName, message)
							.then(onSuccess)
							.catch(onError);
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