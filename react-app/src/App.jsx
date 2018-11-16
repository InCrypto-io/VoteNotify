import React from 'react';
import NumericInput from 'react-numeric-input';
import { Modal, Button } from 'react-bootstrap';
import ReactLoading from 'react-loading';
import './index.css';
import './flex.css';


class Info extends React.Component
{
	render()
	{
		var bg = (this.props.good) ? "bg-green " : "bg-red ";
		var outline = (this.props.selected) ?
			((this.props.good) ? "outline-green-solid " : "outline-red-solid ") :
			"";
		return (
			<div className={ "align-items-center d-flex flex-grow-1 form-group form-inline " +
				"justify-content-center mb-0 mt-0 " +
				"margin-top-30px with-line-height padding-14px-20px " + bg + outline }
				>
				<label className="color-white mb-0"> { this.props.value } </label>
				{(this.props.loading) ?
					<ReactLoading className="ml-2" type="spin" color="white"
						height={20} width={20} /> :
					null}
			</div>);
	}
}


class InputField extends React.Component
{
	render()
	{
		return (
			<div className="form-group margin-top-30px">
				<label>
					{ this.props.label }
				</label>
				<textarea className='form-control'
					rows={ this.props.rows }
					maxlength={ this.props.maxlength }
					placeholder=""
					onChange={ this.props.onChange }>
				</textarea>
			</div>);
	}
}


class DropDown extends React.Component
{
	render()
	{
		let optionItems = this.props.items.map(item => 
			<option value={item}>{item}</option>);
		(optionItems.length !== 0) ?
			optionItems = [<option value="" disabled selected hidden>Select...</option>]
				.concat(optionItems) :
			optionItems = [<option value="" disabled selected>No options</option>];
		return (
			<div className="form-group margin-top-30px">
				<label>
					{ this.props.label }
				</label>
				<select onChange={ this.props.onChange } value={ this.props.value }
					className='form-control'>
					{ optionItems }
				</select>
			</div>);
	}
}


const eosValidSymbols = '.12345abcdefghijklmnopqrstuvwxyz';

export default class MainPage extends React.Component
{
	constructor(props)
	{
		super(props);
		this.state = {
			vote: "1",
			scatterAccList: [],
			senderAcc: '',
			bpAcc: '',
			memo: '',
			newVoted: 0,
			newUnvoted: 0,
			newVotedLoading: false,
			newUnvotedLoading: false,
			maxNotifications: 100,
			modalInfo: "",
			modalShow: false
		};
	}

	componentDidMount()
	{
		this.askServer();
		this.props.eosapp.connectScatter()
			.then(connected =>
			{
				if (!connected)
				{
					this.showModal("Failed to connect to Scatter");
					return;
				}
				return this.props.eosapp.getScatterAccounts()
					.then(accounts => this.setState({ scatterAccList: accounts }));
			})
			.catch(error =>
			{
				this.showModal("Failed to connect to Scatter:\n" + error.toString());
			});
	}

	showModal = (info) => this.setState({ modalInfo: info, modalShow: true });
	closeModal = () => this.setState({ modalInfo: "", modalShow: false });

	toggleNewVotedLoading = (show) => this.setState({ newVotedLoading: show });
	toggleNewUnvotedLoading = (show) => this.setState({ newUnvotedLoading: show});

	async askServer()
	{
		var newVoted = 0;
		var newUnvoted = 0;
		try {
			if (this.isBpAccValid())
			{
				newVoted = (await this.props.httpclient.getNewVotedCount(this.state.bpAcc)).count;
				newUnvoted = (await this.props.httpclient.getNewUnvotedCount(this.state.bpAcc)).count;
			}
		}
		catch (e) {
		}
		this.setState({ newVoted: newVoted, newUnvoted: newUnvoted });
		setTimeout(() => { this.askServer() }, 3000);
	}

	isBpAccValid()
	{
		if (this.state.bpAcc === "")
		{
			return false;
		}
		var valid = true;
		for (var i = 0; i < this.state.bpAcc.length; i++)
		{
			if (!eosValidSymbols.includes(this.state.bpAcc.charAt(i)))
			{
				valid = false;
			}
		}
		return valid;
	}

	isMemoValid()
	{
		return this.state.memo !== "";
	}

	isSenderValid()
	{
		return this.state.senderAcc !== "";
	}

	//***Handlers***
	handleSenderAccChange = (e) => this.setState({ senderAcc: e.target.value });

	handleBpAccChange = (e) => this.setState({ bpAcc: e.target.value });

	handleMemoChange = (e) => this.setState({ memo: e.target.value });

	handleMaxNotificationsChange = (valueAsNumber, valueAsString, element) =>
	{
		if (valueAsNumber !== null)
			this.setState({ maxNotifications: valueAsNumber });
	}

	handleModeChange = (e) => {
		this.setState({
			[e.target.name]: e.target.value
		})
	}

	handleSendClick = async () =>
	{
		if (!this.isSenderValid())
		{
			this.showModal('Sender account must be choosen');
			return;
		}
		else if (!this.isBpAccValid())
		{
			this.showModal('EOS account name must be not empty ' +
				'and can contain only \'' + eosValidSymbols + '\' symbols.');
			return;
		}
		else if (!this.isMemoValid())
		{
			this.showModal('Memo must be filled.');
			return;
		}

		if (this.state.vote === "1")
		{
			(!this.state.newVotedLoading) ?
				this.send(this.props.httpclient.getNewVoted,
					this.props.httpclient.putNewVoted,
					this.toggleNewVotedLoading) :
				this.showModal('Notifications are being processed.');
		}
		else if (this.state.vote === "0")
		{
			(!this.state.newUnvotedLoading) ?
				this.send(this.props.httpclient.getNewUnvoted,
					this.props.httpclient.putNewUnvoted,
					this.toggleNewUnvotedLoading) :
				this.showModal('Notifications are being processed.');
		}
	}
	//===================

	send = (getAccounts, putAccounts, toggleLoading) =>
	{
		getAccounts(this.state.bpAcc)
			.then(async (json) =>
			{
				toggleLoading(true);
				console.log(json);
				var accounts = json.accounts;
				if (accounts.length === 0)
				{
					this.showModal('There is no accounts to notify.');
					toggleLoading(false);
					return;
				}
				var sendCount = Math.min(accounts.length, this.state.maxNotifications);
				var successfullySent = 0;
				for (var i = 0; i < sendCount; i++)
				{
					try {
						await this.props.eosapp.sendMemo(this.state.senderAcc,
							accounts[i], this.state.memo);
						try {
							var response = await putAccounts(this.state.bpAcc, [accounts[i]]);
							successfullySent += 1;
						}
						catch (error) {
							console.log(error);
						};
					}
					catch (e) {
						console.error(e);
					}
				}
				this.showModal('Successfully sent: ' + successfullySent.toString());
				toggleLoading(false);
			})
			.catch((error) =>
			{
				this.showModal('Failed to get info from server:\n' + error.toString());
				toggleLoading(false);
			});
	}

	render()
	{
		return (
			<div className="min-width-300px">
				<div className="d-flex">
					<Info value={ 'New voted: ' + this.state.newVoted.toString() }
					good={ true }
					selected={ this.state.vote === "1" ? true: false }
					loading={ this.state.newVotedLoading } />
				<Info value={ 'New unvoted: ' + this.state.newUnvoted.toString() }
					good={ false }
					selected={ this.state.vote === "0" ? true: false }
					loading={ this.state.newUnvotedLoading } />
				</div>
				<div className="form-group margin-top-30px">
					<label>Max transactions</label>
					<NumericInput className="form-control"
						min={ 1 } max={ 1000 } value={ this.state.maxNotifications }
						onChange={ this.handleMaxNotificationsChange } />
				</div>
				<DropDown
					label="Sender account" items={ this.state.scatterAccList }
					value={ this.state.senderAcc } onChange={ this.handleSenderAccChange }
				/>
				<InputField
					label="BP account" rows={ 1 } maxlength={ 12 }
					onChange={ this.handleBpAccChange }
				/>
				<select onChange={ this.handleModeChange }
					className='form-control margin-top-30px'
					name="vote" value={ this.state.vote }>
					<option value="1">Voted</option>
					<option value="0">Unvoted</option>
				</select>
				<InputField
					label="Memo" rows={ 4 } maxlength={ 250 }
					onChange={ this.handleMemoChange }
				/>
				<button onClick={ this.handleSendClick }
					className="send-button padding-14px-20px">
					Send
				</button>
				<Modal show={this.state.modalShow} onHide={ this.closeModal }>
					<Modal.Body bsClass="font-size-1-2em margin-20px">
						{ this.state.modalInfo }
					</Modal.Body>
				    <Modal.Footer>
				      <Button bsStyle="primary" onClick={ this.closeModal }>Close</Button>
				    </Modal.Footer>
				</Modal>
			</div>
		);
	}
}