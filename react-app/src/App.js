import React from 'react';
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
			<div>
				{ this.props.label }
				<input
					type="text"
					placeholder=""
					onChange={ this.props.onChange }/>
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
			memo: ''
		};
	}

	handleBpAccChange(e)
	{
		this.setState({ bpAcc: e.target.value });
	}

	handleMemoChange(e)
	{
		this.setState({ memo: e.target.value });
	}

	handleSendVotedClick = () =>
	{
		this.props.eosapp.sendVoted(this.state.bpAcc, this.state.memo,
			console.log, console.log);
	}

	handleSendUnvotedClick = () =>
	{
		this.props.eosapp.sendUnvoted(this.state.bpAcc, this.state.memo,
			console.log, console.log);
	}

	onChangeHandler = (e) => {
		this.setState({
			[e.target.name]: e.target.value
		})
	}

	onSendClickHandler = () =>
	{
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
			<div>
				<InputField 
					label="BP account"
					onChange={(e) => this.handleBpAccChange(e) }/>
				<select onChange={this.onChangeHandler} name="vote" value={this.state.vote}>
					<option value="1">
						Voted
					</option>
					<option value="0">
						Unvoted
					</option>
				</select>
				<InputField 
					label="Memo"
					onChange={(e) => this.handleMemoChange(e) }/>
				<button onClick={this.onSendClickHandler}>
					Send
				</button>
			</div>);
	}
}