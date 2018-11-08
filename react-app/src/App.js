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
			<div className="form-group with-vertical-margin">
				<label >
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
			memo: ''
		};
	}

	handleBpAccChange = (e) =>
	{
		this.setState({ bpAcc: e.target.value });
	}

	handleMemoChange = (e) =>
	{
		this.setState({ memo: e.target.value });
	}

	handleSendVotedClick = () =>
	{
		this.props.httpclient.getNewVoted(this.state.bpAcc)
			.then(async (json) =>
			{
				console.log(json);
				var accounts = json.accounts;
				for (var i = 0; i < accounts.length; i++)
				{
					await this.props.eosapp.sendMemo(this.state.bpAcc,
						accounts[i], this.state.memo);
					this.props.httpclient.putNewVoted(this.state.bpAcc, [accounts[i]])
						.then(console.log)
						.catch(console.error);
				}
			})
			.catch(console.error);
	}

	handleSendUnvotedClick = () =>
	{
		this.props.httpclient.getNewUnvoted(this.state.bpAcc)
			.then(async (json) =>
			{
				console.log(json);
				var accounts = json.accounts;
				for (var i = 0; i < accounts.length; i++)
				{
					await this.props.eosapp.sendMemo(this.state.bpAcc,
						accounts[i], this.state.memo);
					this.props.httpclient.putNewUnvoted(this.state.bpAcc, [accounts[i]])
						.then(console.log)
						.catch(console.error);
				}
			})
			.catch(console.error);
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
			<div className="container">
				<InputField
					label="BP account" rows={ 1 } maxLength={ 12 }
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
			</div>);
	}
}