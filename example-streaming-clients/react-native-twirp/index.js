import { NativeEventEmitter, DeviceEventEmitter, Platform } from 'react-native'
import { Observable, Subscriber } from 'rxjs'
import base64 from '@protobufjs/base64'

//
// XXX: Hand-copy of twirpjs/helpers.js because it isn't bundling for some reason
//
import utf8 from '@protobufjs/utf8'

// Debugging helpers
export const toHex = x => '0x' + ('00' + x.toString(16)).slice(-2)
export const toHexArray = arr => Array.prototype.map.call(arr, ToHex).join(' ')

// Twirp error codes
export const ERROR_CODES = {
	TRANSPORT:           'transport', // unique to twirpjs
	INTERNAL:            'internal',
	UNKNOWN:             'unknown',
	INVALID_ARGUMENT:    'invalid_argument',
	DEADLINE_EXCEEDED:   'deadline_exceeded',
	NOT_FOUND:           'not_found',
	BAD_ROUTE:           'bad_route',
	ALREADY_EXISTS:      'already_exists',
	PERMISSION_DENIED:   'permission_denied',
	UNAUTHENTICATED:     'unauthenticated',
	RESOURCE_EXHAUSTED:  'resource_exhausted',
	FAILED_PRECONDITION: 'failed_precondition',
	ABORTED:             'aborted',
	OUT_OF_RANGE:        'out_of_range',
	UNIMPLEMENTED:       'unimplemented',
	INTERNAL:            'internal',
	UNAVAILABLE:         'unavailable',
	DATA_LOSS:           'data_loss',
}

export class TwirpError extends Error {
	constructor(twerrObj) {
		const { msg, message } = twerrObj
		if (!msg && !message) {
			super(`Badly formed twirp error: must have msg or message field, got "${JSON.stringify(twerrObj)}"`)
			return
		}
		if (msg && message) {
			super(`Badly formed twirp error: cannot have both msg and message fields, got msg="${msg}" and message="${message}"`)
			return
		}
		super(msg || message)
		this.name = this.constructor.name
		for (const kk of Object.keys(twerrObj)) {
			this[kk] = twerrObj[kk]
		}
		this.toString = () => { return this.message }
	}
}

export class TwirpErrorIntermediate extends TwirpError {
	constructor(msg, meta = {}) {
		super({ msg, meta, code: ERROR_CODES.INTERNAL })
	}
}

//
// Observable twirp implementation (Subscriber and Observer)
//
export default class TwirpObservable extends Observable {
	constructor(options) {
		super()
		this.options = options
	}
	_subscribe(destination) {
		return new TwirpSubscriber(destination, this.options)
	}
}

class TwirpSubscriber extends Subscriber {
	constructor(destination, options) {
		super(destination)
		this.options = options
		this.unsubscribed = false
		const { request, reqType } = options

		const reqErr = reqType.verify(request)
		if (reqErr) {
			const errMsg = `Bad ${reqType} request`
			this.error(new TwirpError({
				code: ERROR_CODES.INVALID_ARGUMENT,
				msg: errMsg,
				meta: { cause: reqErr }
			}))
			return
		}
		const reqBytes = reqType.encode(request).finish()
		const reqBase64 = base64.encode(reqBytes, 0, reqBytes.length)
		this.send(reqBase64).catch(err => {
			this.error(new TwirpErrorIntermediate(`Unable to send request`, err))
			// throw err
		})
	}

	send = async (reqBase64) => {
		const { hostURL, respType, nativeClient, rpcName } = this.options
		if (!nativeClient) {
			this.error(new TwirpErrorIntermediate(`The native module is missing for ${rpcName}`))
			return
		}
		if (!nativeClient[rpcName]) {
			this.error(new TwirpErrorIntermediate(`${rpcName} is not defined on the native module`))
			return
		}
		const { eventName, id } = await nativeClient[rpcName](hostURL, reqBase64)
		this.reqID = id
		// console.warn(`Called nativeClient[${rpcName}](${hostURL}, reqBase64) =>`, eventName, this.reqID)
		const emitter = Platform.OS === 'ios' ? new NativeEventEmitter(nativeClient) : DeviceEventEmitter
		const listener = emitter.addListener(
			eventName,
			this.handleResp,
		)
		this.add(() => listener.remove()) // register listener for cleanup on unsubscribe
	}

	handleResp = resp => {
		// console.log('[TwirpSubscriber]', '(handleResp)')
		const { respType } = this.options
		const { next, error, completed, id } = resp
		if (id !== this.reqID) {
			// console.log(`Skipping message with id=${id} (this.reqID=${this.reqID})`)
			return
		}
		if (completed) {
			// console.log('[TwirpSubscriber]', 'Completed')
			this.complete()
			return
		}
		if (error) {
			// console.log('[TwirpSubscriber]', 'Failed:', error)
			this.error(new TwirpError(error))
			return
		}
		const { sizeBytes, dataBase64 } = next
		const respBytes = new Uint8Array(sizeBytes)
		try {
			base64.decode(dataBase64, respBytes, 0)
			const respMsg = respType.decode(respBytes)
			// console.log('[TwirpSubscriber]', 'Decoded resp:', respMsg)
			this.next(respMsg)
		} catch (err) {
			// console.error('[TwirpSubscriber]', 'Failed to decode response:', err)
			this.error(new TwirpErrorIntermediate('Failed to decode twirp response', { cause: err }))
		}
	}

	async unsubscribe() {
		if (this.unsubscribed) { return }
		this.unsubscribed = true
		const { nativeClient, rpcName } = this.options
		const abortRPC = `Abort${rpcName}`
		if (!nativeClient || !nativeClient[abortRPC]) {
			return
		}
		nativeClient[abortRPC](this.reqID).catch(err => {
			console.log(`[TwirpSubscriber] Unable to unsubscribe from ${rpcName} request #${this.reqID}:`, err)
		})
		super.unsubscribe()
	}
}
