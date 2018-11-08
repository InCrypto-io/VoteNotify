import React from 'react';
import NumericInput from 'react-numeric-input';
import Modal, {closeStyle} from 'simple-react-modal'
import './index.css';


class InputField extends React.Component
{
	constructor(props)
	{
		super(props);
	}

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


export default class MainPage extends React.Component
{
	constructor(props)
	{
		super(props);
		this.state = {
			vote: "1",
			bpAcc: '',
			memo: '',
			newVoted: 0,
			newUnvoted: 0,
			maxNotifications: 1,
			modalInfo: "",
			modalShow: false
		};
		this.askServer();
	}

	showModal = (info) =>
	{
		this.setState({modalInfo: info, modalShow: true});
	}

	closeModal = () =>
	{
		this.setState({modalShow: false});
	}

	async askServer()
	{
		var newVoted = 0;
		var newUnvoted = 0;
		try {
			newVoted = (await this.props.httpclient.getNewVotedCount(this.state.bpAcc)).count;
			newUnvoted = (await this.props.httpclient.getNewUnvotedCount(this.state.bpAcc)).count;
		}
		catch (e) {
			console.log(e);
		}
		this.setState({ newVoted: newVoted, newUnvoted: newUnvoted });
		setTimeout(() => { this.askServer() }, 3000);
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
			this.setState({maxNotifications: valueAsNumber});
	}

	handleSendVotedClick = (maxNotifications) =>
	{
		this.props.httpclient.getNewVoted(this.state.bpAcc)
			.then(async (json) =>
			{
				console.log(json);
				var accounts = json.accounts;
				var sendCount = Math.min(accounts.length, maxNotifications);
				for (var i = 0; i < sendCount; i++)
				{
					try {
						await this.props.eosapp.sendMemo(this.state.bpAcc,
							accounts[i], this.state.memo);
						this.props.httpclient.putNewVoted(this.state.bpAcc, [accounts[i]])
							.then(console.log)
							.catch((error) =>
							{
								this.showModal('Failed to send notified accounts to server: ' +
									error.toString());
							});
					}
					catch (e) {
						console.error(e);
						this.showModal('Failed to send memo: ' + e.toString());
					}
				}
			})
			.catch((error) =>
			{
				this.showModal('Failed to get info from server: ' + error.toString());
			});
	}

	handleSendUnvotedClick = (maxNotifications) =>
	{
		this.props.httpclient.getNewUnvoted(this.state.bpAcc)
			.then(async (json) =>
			{
				console.log(json);
				var accounts = json.accounts;
				var sendCount = Math.min(accounts.length, maxNotifications);
				for (var i = 0; i < sendCount; i++)
				{
					try {
						await this.props.eosapp.sendMemo(this.state.bpAcc,
							accounts[i], this.state.memo);
						this.props.httpclient.putNewUnvoted(this.state.bpAcc, [accounts[i]])
							.then(console.log)
							.catch((error) =>
							{
								this.showModal('Failed to send notified accounts to server: ' +
									error.toString());
							});
					}
					catch (e) {
						console.error(e);
						this.showModal('Failed to send memo: ' + e.toString());
					}
				}
			})
			.catch((error) =>
			{
				this.showModal('Failed to get info from server: ' + error.toString());
			});
	}

	onChangeHandler = (e) => {
		this.setState({
			[e.target.name]: e.target.value
		})
	}

	onSendClickHandler = async () =>
	{
		if (this.state.vote === "1")
		{
			this.handleSendVotedClick(this.state.maxNotifications);
		}
		else if (this.state.vote === "0")
		{
			this.handleSendUnvotedClick(this.state.maxNotifications);
		}
	}

	render()
	{
		return (
			<div className="container">
				<div className="form-group with-vertical-margin">
					<label>
						{ 'Max transactions:' }
					</label>
				</div>
				<hr/>
				<div className="form-group with-vertical-margin">
					<NumericInput className="form-control"
						min={1} max={1000}
						onChange={ this.handleMaxNotificationsChange }/>
				</div>
				<div className="form-control with-vertical-margin">
					<label>
						{ 'New voted: ' + this.state.newVoted.toString() }
					</label>
				</div>
				<div className="form-control with-vertical-margin">
					<label>
						{ 'New unvoted: ' + this.state.newUnvoted.toString() }
					</label>
				</div>
				<InputField
					label="BP account" rows={ 1 } maxlength={ 12 }
					onChange={ this.handleBpAccChange }/>
				<select onChange={ this.onChangeHandler } className='form-control with-vertical-margin'
					name="vote" value={ this.state.vote }>
					<option value="1">
						Voted
					</option>
					<option value="0">
						Unvoted
					</option>
				</select>
				<InputField
					label="Memo" rows={ 3 } maxlength={ 250 }
					onChange={ this.handleMemoChange }/>
				<button onClick={ this.onSendClickHandler }>
					Send
				</button>
				<Modal show={this.state.modalShow}
					closeOnOuterClick={true}
					onClose={this.closeModal}
					transitionSpeed={10}
					>
					<div>{this.state.modalInfo}</div>
				</Modal>
			</div>);
	}
}