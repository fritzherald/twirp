import './App.css'
import React, { Component } from 'react'
import { registerTransportGenerator, TRANSPORT_TYPES, ERROR_CODES } from 'twirpjs'
import createObservableTransport from 'twirpjs/transports/rxjs_transport'
import { newTwirperClient } from './twirper.twirp'

registerTransportGenerator({
	name: 'RXJS',
	generator: createObservableTransport,
})


const log = (...args) => console.log('[App.js]', ...args)

class App extends Component {
	constructor() {
		super()
		this.respCounter = 0
		this.twirperClient = newTwirperClient('http://localhost:8888')
		this.observableClient = newTwirperClient('http://localhost:8888', {
			transportType: TRANSPORT_TYPES.RXJS,
			ajaxOptions: { crossDomain: true }, // passed through to AjaxObservable
		})
		this.state = { resps: [], oldResps: [] }

		log('Obsv client:', this.observableClient)

		// this.callEcho = this.callEcho.bind(this)
		// this.callRepeat = this.callRepeat.bind(this)
		// this.callRepeatHeavy = this.callRepeatHeavy.bind(this)
		// this.callRepeatErrorAfter = this.callRepeatErrorAfter.bind(this)
		// this.callBadRoute = this.callBadRoute.bind(this)
		// this.callBadHost = this.callBadHost.bind(this)
		// this._clearPreviousResps = this._clearPreviousResps.bind(this)
		// this._callRepeat = this._callRepeat.bind(this)
		// this._pushError = this._pushError.bind(this)
	}

	//
	// Classic twirp rpc - fetch transport
	//
	callEcho = async () => {
		const ll = (...args) => log('(callEcho)', ...args)
		this._clearPreviousResps()
		try {
			const resp = await this.twirperClient.Echo({ Message: 'Echo?' })
			resp.key = ++this.respCounter
			ll('Echo response:', resp)
			this.setState(state => ({ resps: [...state.resps, resp] }))
		} catch (err) {
			console.error('Echo failed:', err.message, { err })
			this._pushError(err)
		}
	}

	//
	// Classic twirp rpc - observable transport
	//
	callObservableEcho = () => {
		const ll = (...args) => log('(callObservableEcho)', ...args)
		this._clearPreviousResps()
		this.observableClient.Echo({ Message: 'Observable echo?' })
			.subscribe(
				resp => {
					resp.key = ++this.respCounter
					ll('Echo response:', resp)
					this.setState(state => ({ resps: [...state.resps, resp] }))
				},
				err => {
					console.error('Echo failed:', err.message, { err })
					this._pushError(err)
				},
				() => { ll('Echo complete') },
			)
	}

	//
	// Streaming responses - fetch transport
	//
	callRepeat = async () => {
		const repeats = 10
		await this._callRepeat({
			Message: `This message should be repeated ${repeats} times`,
			NumRepeats: repeats,
			DelayMs: 200,
		})
	}
	callRepeatErrorAfter = async () => {
		await this._callRepeat({
			Message: `This message should be repeated four times and then followed by an error`,
			NumRepeats: 10,
			DelayMs: 200,
			ErrAfter: 4,
		})
	}
	callRepeatHeavy = async () => {
		await this._callRepeat(
			{
				Message: 'No delay, lots of repeats',
				NumRepeats: 30000,
				DelayMs: 0,
			},
			3000,
		)
	}
	_callRepeat = async (req, filterMod) => {
		const ll = (...args) => log('(callRepeat)', ...args)
		this._clearPreviousResps()
		const startedAt = new Date()
		try {
			await this.twirperClient.Repeat(req, resp => {
				resp.key = ++this.respCounter
				if (!filterMod || resp.ID % filterMod === 0) {
					const elapsedSec = (new Date() - startedAt) / 1000
					const respsPerSec = resp.ID / elapsedSec
					// ll('Received response:', resp)
					this.setState(state => ({ resps: [...state.resps, resp], respsPerSec }))
				}
			})
			ll('Repeat completed')
		} catch (err) {
			console.error('Repeat failed:', err)
			this._pushError(err)
		}
	}

	//
	// Streaming responses - observable transport
	//
	callObservableRepeat = () => {
		const repeats = 10
		this._callObservableRepeat({
			Message: `This message should be repeated ${repeats} times`,
			NumRepeats: repeats,
			DelayMs: 200,
		})
	}
	callObservableRepeatErrorAfter = () => {
		this._callObservableRepeat({
			Message: `This message should be repeated four times and then followed by an error`,
			NumRepeats: 10,
			DelayMs: 200,
			ErrAfter: 4,
		})
	}
	callObservableRepeatHeavy = () => {
		this._callObservableRepeat(
			{
				Message: 'No delay, lots of repeats',
				NumRepeats: 30000,
				DelayMs: 0,
			},
			3000,
		)
	}
	callObservableRepeatAbort = () => {
		const sub = this._callObservableRepeat(
			{
				Message: 'No delay, lots of repeats',
				NumRepeats: 50,
				DelayMs: 200,
			},
		)
		setTimeout(() => {
			this.setState(state => ({ resps: [...state.resps, { aborted: true, key: ++this.respCounter }] }))
			sub.unsubscribe()
		}, 1000)
	}
	_callObservableRepeat(req, filterMod) {
		const ll = (...args) => log('(callRepeat)', ...args)
		this._clearPreviousResps()
		const startedAt = new Date()
		return this.observableClient.Repeat(req)
			.subscribe(
				resp => {
					resp.key = ++this.respCounter
					if (!filterMod || resp.ID % filterMod === 0) {
						const elapsedSec = (new Date() - startedAt) / 1000
						const respsPerSec = resp.ID / elapsedSec
						// ll('Received response:', resp)
						this.setState(state => ({ resps: [...state.resps, resp], respsPerSec }))
					}
				},
				err => {
					console.error('Repeat failed:', err)
					this._pushError(err)
				},
				() => ll('Repeat completed'),
			)
	}

	//
	// Bad requests - fetch transport
	//
	callBadRoute = async () => {
		const client = newTwirperClient('http://localhost:8888/not/a/valid/route')
		this._callBadReq(client, 'BadRoute', ERROR_CODES.BAD_ROUTE)
	}
	callBadHost = async () => {
		const client = newTwirperClient('http://badhost:282347')
		this._callBadReq(client, 'BadHost', ERROR_CODES.TRANSPORT)
	}
	_callBadReq = async (client, reqName, expectedCode) => {
		const ll = (...args) => log(`(call${reqName})`, ...args)
		this._clearPreviousResps()
		try {
			const resp = await client.Echo({ Message: `Is any server out there?` })
			resp.key = ++this.respCounter
			ll(`${reqName} response:`, resp)
			this.setState(state => ({ resps: [...state.resps, resp] }))
		} catch (err) {
			if (err.code === expectedCode) {
				err.meta.failed_as_expected = true
				ll(`${reqName} failed as expected:`, { err })
			} else {
				err.meta.failed_as_expected = false
				console.error(`${reqName} failed but not for the expected reason:`, { err })
			}
			this._pushError(err)
			return
		}
		throw new Error(`call${reqName} should have errored`)
	}

	//
	// Bad requests - observable transport
	//
	callObservableBadRoute = () => {
		const client = newTwirperClient('http://localhost:8888/not/a/valid/route', {
			transportType: TRANSPORT_TYPES.RXJS,
			ajaxOptions: { crossDomain: true }, // passed through to AjaxObservable
		})
		this._callBadObservableReq(client, 'BadRoute', ERROR_CODES.BAD_ROUTE)
	}
	callObservableBadHost = () => {
		const client = newTwirperClient('http://badhost:282347', {
			transportType: TRANSPORT_TYPES.RXJS,
			ajaxOptions: { crossDomain: true }, // passed through to AjaxObservable
		})
		this._callBadObservableReq(client, 'BadHost', ERROR_CODES.TRANSPORT)
	}
	_callBadObservableReq = (client, reqName, expectedCode) => {
		const ll = (...args) => log(`(callObservable${reqName})`, ...args)
		this._clearPreviousResps()
		client.Echo({ Message: 'Is any server out there?' }).subscribe(
			resp => {
				resp.key = ++this.respCounter
				ll(`${reqName} response:`, resp)
				this.setState(state => ({ resps: [...state.resps, resp] }))
				const err = new Error(`callObservable${reqName} should have errored`)
				console.error(err)
				this._pushError(err)
			},
			err => {
				if (err.code === expectedCode) {
					err.meta.failed_as_expected = true
					const msg = `${reqName} failed as expected (probably):`
					ll(msg, { err })
				} else {
					err.meta.failed_as_expected = false
					const msg = `${reqName} failed but not for the expected reason:`
					console.error(msg, { err })
				}
				this._pushError(err)
			},
			() => {
				const err = new Error(`${reqName} should not have completed`)
				console.error(err)
				this._pushError(err)
			},
		)
	}

	_clearPreviousResps = () => {
		this.setState(state => {
			const resps = state.resps.map(rr => {
				rr.opacity = 0.2
				return rr
			})
			if (resps.length) {
				resps[0].clear = 'left'
			}
			return {
				resps: [],
				oldResps: [...resps, ...state.oldResps],
				respsPerSec: null,
			}
		})
	}

	_pushError = err => {
		this.setState(state => ({
			resps: [
				...state.resps,
				{ error: err.message, meta: err.meta, code: err.code, key: ++this.respCounter },
			],
		}))
	}

	render = () => {
		const { resps, oldResps, respsPerSec } = this.state
		return (
			<div className="App" style={{ backgroundColor: 'lightgray', overflow: 'auto', padding: 20 }}>
				<h3>Default fetch transport:</h3>
				<button onClick={this.callEcho}><h2>Call Echo</h2></button>
				<button onClick={this.callRepeat}><h2>Call Repeat</h2></button>
				<button onClick={this.callRepeatHeavy}><h2>Call Repeat (heavy load)</h2></button>
				<button onClick={this.callRepeatErrorAfter}><h2>Call Repeat (server error after 4 resps)</h2></button>
				<button onClick={this.callBadRoute}><h2>Call a bad route</h2></button>
				<button onClick={this.callBadHost}><h2>Call a bad host url</h2></button>
				<div style={{ clear: 'both', height: 10 }} />
				<h3>RxJS observable transport:</h3>
				<button onClick={this.callObservableEcho}><h2>Call Echo</h2></button>
				<button onClick={this.callObservableRepeat}><h2>Call Repeat</h2></button>
				<button onClick={this.callObservableRepeatHeavy}><h2>Call Repeat (heavy load)</h2></button>
				<button onClick={this.callObservableRepeatAbort}><h2>Call Repeat (abort early)</h2></button>
				<button onClick={this.callObservableRepeatErrorAfter}><h2>Call Repeat (server error after 4 resps)</h2></button>
				<button onClick={this.callObservableBadRoute}><h2>Call a bad route</h2></button>
				<button onClick={this.callObservableBadHost}><h2>Call a bad host url</h2></button>
				{respsPerSec && <pre>Responses per second: {respsPerSec.toFixed(1)}</pre>}
				<Responses resps={[...resps, ...oldResps]} />
			</div>
		)
	}
}

const Responses = ({ resps, style }) => (
	<div style={{ clear: 'both', width: '100%', textAlign: 'center', marginTop: 20 }}>
		{resps.map(resp => (
			<pre
				key={`resp-${resp.key}`}
				style={{
					fontSize: '9pt',
					float: 'left',
					backgroundColor: resp.error && !resp.error.match(/failed as expected/) ? '#c41' : '#444',
					color: 'white',
					padding: '5px',
					margin: '5px',
					textAlign: 'left',
					transition: 'all .7s ease-out',
					opacity: resp.opacity || 1.0,
					clear: resp.clear || 'auto',
					...(style || {}),
				}}
			>
				{JSON.stringify(resp, null, 3)}
			</pre>
		))}
	</div>
)

export default App
