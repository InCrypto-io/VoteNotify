import React from 'react';
import NumericInput from 'react-numeric-input';
import Modal, {closeStyle} from 'simple-react-modal';
import ReactLoading from 'react-loading';
import './index.css';


class Info extends React.Component
{
	render()
	{
		return (
			<div className="form-inline form-group with-vertical-margin"
				style={{lineHeight: '1.1em'}}>
				<label> { this.props.value } </label>
				{(this.props.loading) ?
					<ReactLoading className="ml-2" type="spin" color="gray"
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
			<div className="form-inline form-group with-vertical-margin custom-container">
				<label>
					{ this.props.label }
				</label>		
				<textarea className='form-control width-80percents-override'
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
		this.setState({modalInfo: info, modalShow: true});
	}

	closeModal = () =>
	{
		this.setState({modalInfo: "", modalShow: false});
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
				this.setState({newVotedLoading: true});
				console.log(json);
				var accounts = json.accounts;
				if (accounts.length == 0)
				{
					this.showModal('There is no recently voted accounts.');
					this.setState({newVotedLoading: false});
					return;
				}
				var sendCount = Math.min(accounts.length, maxNotifications);
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
				this.setState({newVotedLoading: false});
			})
			.catch((error) =>
			{
				this.showModal('Failed to get info from server: ' + error.toString());
				this.setState({newVotedLoading: false});
			});
	}

	handleSendUnvotedClick = (maxNotifications) =>
	{
		this.props.httpclient.getNewUnvoted(this.state.bpAcc)
			.then(async (json) =>
			{
				this.setState({newUnvotedLoading: true});
				console.log(json);
				var accounts = json.accounts;
				if (accounts.length == 0)
				{
					this.showModal('There is no recently unvoted accounts.');
					this.setState({newUnvotedLoading: false});
					return;
				}
				var sendCount = Math.min(accounts.length, maxNotifications);
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
				this.setState({newUnvotedLoading: false});
			})
			.catch((error) =>
			{
				this.showModal('Failed to get info from server: ' + error.toString());
				this.setState({newUnvotedLoading: false});
			});
	}

	onChangeHandler = (e) => {
		this.setState({
			[e.target.name]: e.target.value
		})
	}

	onSendClickHandler = async () =>
	{
		if (this.state.bpAcc == "")
		{
			this.showModal('Block producer account name must be filled.');
			return;
		}
		else if (this.state.memo == "")
		{
			this.showModal('Memo must be filled.');
			return;
		}

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
				<Info value={ 'New voted: ' + this.state.newVoted.toString() }
					loading={ this.state.newVotedLoading } />
				<Info value={ 'New unvoted: ' + this.state.newUnvoted.toString() }
					loading={ this.state.newUnvotedLoading } />
				<div className="form-inline form-group with-vertical-margin custom-container">
					<label>Max transactions:</label>
					<NumericInput className="form-control"
						min={1} max={1000}
						onChange={ this.handleMaxNotificationsChange } />
				</div>
				<InputField
					label="BP account" rows={ 1 } maxlength={ 12 }
					onChange={ this.handleBpAccChange }/>
				<select onChange={ this.onChangeHandler } className='form-control with-vertical-margin'
					name="vote" value={ this.state.vote }>
					<option value="1">Voted</option>
					<option value="0">Unvoted</option>
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