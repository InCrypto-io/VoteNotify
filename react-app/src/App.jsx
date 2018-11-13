import React from 'react';
import NumericInput from 'react-numeric-input';
import ReactModal from 'react-modal';
import ReactLoading from 'react-loading';
import './index.css';


class Info extends React.Component
{
	render()
	{
		var bg = (this.props.good) ? "bg-success" : "bg-danger";
		return (
			<div className={"align-items-center d-flex flex-grow-1 form-group form-inline " +
				"justify-content-center mb-0 mt-0 p-3 with-vertical-margin with-line-height " + bg}
				>
				<label className="color-white"> { this.props.value } </label>
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
			<div className="form-group with-vertical-margin">
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


const eosValidSymbols = '.12345abcdefghijklmnopqrstuvwxyz';

export default class MainPage extends React.Component
{
	constructor(props)
	{
		super(props);
		this.state = {
			vote: "1",
			bpAcc: '',
			memo: '',
			/*newVotedInfo: {
				count: 0,
				isLoading: false
			},
			newUnvotedInfo: {
				count: 0,
				isLoading: false
			},*/
			newVoted: 0,
			newUnvoted: 0,
			newVotedLoading: false,
			newUnvotedLoading: false,
			maxNotifications: 100,
			modalInfo: "",
			modalShow: false
		};
		this.askServer();
	}

	showModal = (info) =>
	{
		this.setState({ modalInfo: info, modalShow: true });
	}

	closeModal = () =>
	{
		this.setState({ modalInfo: "", modalShow: false });
	}

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

	handleBpAccChange = (e) =>
	{
		this.setState({ bpAcc: e.target.value });
	}

	handleMemoChange = (e) =>
	{
		this.setState({ memo: e.target.value });
	}

	handleMaxNotificationsChange = (valueAsNumber, valueAsString, element) =>
	{
		if (valueAsNumber !== null)
			this.setState({ maxNotifications: valueAsNumber });
	}

	handleSendVotedClick = () =>
	{
		this.props.httpclient.getNewVoted(this.state.bpAcc)
			.then(async (json) =>
			{
				this.setState({ newVotedLoading: true });
				console.log(json);
				var accounts = json.accounts;
				if (accounts.length === 0)
				{
					this.showModal('There is no recently voted accounts.');
					this.setState({ newVotedLoading: false });
					return;
				}
				var sendCount = Math.min(accounts.length, this.state.maxNotifications);
				var successfullySent = 0;
				for (var i = 0; i < sendCount; i++)
				{
					try {
						await this.props.eosapp.sendMemo(this.state.bpAcc,
							accounts[i], this.state.memo);
						try {
							var response = await this.props.httpclient.putNewVoted(this.state.bpAcc, [accounts[i]]);
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
				this.setState({ newVotedLoading: false });
			})
			.catch((error) =>
			{
				this.showModal('Failed to get info from server: ' + error.toString());
				this.setState({ newVotedLoading: false });
			});
	}

	handleSendUnvotedClick = () =>
	{
		this.props.httpclient.getNewUnvoted(this.state.bpAcc)
			.then(async (json) =>
			{
				this.setState({ newUnvotedLoading: true });
				console.log(json);
				var accounts = json.accounts;
				if (accounts.length === 0)
				{
					this.showModal('There is no recently unvoted accounts.');
					this.setState({ newUnvotedLoading: false });
					return;
				}
				var sendCount = Math.min(accounts.length, this.state.maxNotifications);
				var successfullySent = 0;
				for (var i = 0; i < sendCount; i++)
				{
					try {
						await this.props.eosapp.sendMemo(this.state.bpAcc,
							accounts[i], this.state.memo);
						try {
							var response = await this.props.httpclient.putNewUnvoted(this.state.bpAcc, [accounts[i]]);
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
				this.setState({ newUnvotedLoading: false });
			})
			.catch((error) =>
			{
				this.showModal('Failed to get info from server: ' + error.toString());
				this.setState({ newUnvotedLoading: false });
			});
	}

	onChangeHandler = (e) => {
		this.setState({
			[e.target.name]: e.target.value
		})
	}

	onSendClickHandler = async () =>
	{
		if (!this.isBpAccValid())
		{
			this.showModal('Block producer account name must be not empty ' +
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
			this.handleSendVotedClick();
		}
		else if (this.state.vote === "0")
		{
			this.handleSendUnvotedClick();
		}
	}

	render()
	{
		return (
			<div className="container with-min-width-300">
				<div className="d-flex">
					<Info value={ 'New voted: ' + this.state.newVoted.toString() }
					good={ true }
					loading={ this.state.newVotedLoading } />
				<Info value={ 'New unvoted: ' + this.state.newUnvoted.toString() }
					good={ false }
					loading={ this.state.newUnvotedLoading } />
				</div>
				<div className="form-group with-vertical-margin">
					<label>Max transactions</label>
					<NumericInput className="form-control"
						min={ 1 } max={ 1000 } value={ this.state.maxNotifications }
						onChange={ this.handleMaxNotificationsChange } />
				</div>
				<InputField
					label="BP account" rows={ 1 } maxlength={ 12 }
					onChange={ this.handleBpAccChange }/>
				<select onChange={ this.onChangeHandler }
					className='form-control with-vertical-margin'
					name="vote" value={ this.state.vote }>
					<option value="1">Voted</option>
					<option value="0">Unvoted</option>
				</select>
				<InputField
					label="Memo" rows={ 4 } maxlength={ 250 }
					onChange={ this.handleMemoChange }/>
				<button onClick={ this.onSendClickHandler }
					className="send-button">
					Send
				</button>
				<ReactModal
					isOpen={ this.state.modalShow }
					onRequestClose={ this.closeModal }
					closeTimeoutMS={ 0 }
					shouldCloseOnEsc={ true }
					portalClassName="ReactModalPortal"
					style={{
				    content: {
				      position: 'absolute',
				      top: '40%',
				      left: '30%',
				      right: '30%',
				      bottom: '40%'
				    }
				  }}
				>
				<div>
					<p>{ this.state.modalInfo }</p>
					<button className='close-button'
						onClick={ this.closeModal }>Close</button>
				</div>
				</ReactModal>
			</div>);
	}
}