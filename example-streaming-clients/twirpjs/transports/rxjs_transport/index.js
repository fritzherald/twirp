// Copyright (c) 2018 MyGnar, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// 	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import utf8 from '@protobufjs/utf8'
import { Reader } from 'protobufjs/minimal'
import { AjaxObservable } from './ajax_observable' // forked implementation supporting mox-chunked-arraybuffer
import { map } from 'rxjs/operators'
import { Observable, Subscriber, from } from 'rxjs'
import { RegisterTransportGenerator } from '../../core'
import { TwirpError, TwirpErrorIntermediate, ERROR_CODES } from '../../helpers'
import { concatByteArrays, extractMessages, parseTwirpError, STREAMING } from '../../streaming'

//
// splitTwirpMessages is an rxjs observable operator that converts a stream
// of Uint8Arrays to a stream of individual messages
//
const splitTwirpMessages = source => source.lift(new ProtoStreamSplitter())
class ProtoStreamSplitter {
	call(sink, source) { return source.subscribe(new ProtoStreamSubscriber(sink)) }
}
class ProtoStreamSubscriber extends Subscriber {
	constructor(destination) {
		super(destination)
		this.leftover = null
	}
	_next(byteArray) {
		try {
			const bb = concatByteArrays(this.leftover, byteArray)
			this.leftover = null
			for (const protoMsg of extractMessages(bb)) {
				const { msgBytes, isIncomplete } = protoMsg
				if (this.destination.closed) {
					this.unsubscribe()
					return
				}
				if (isIncomplete) {
					this.leftover = msgBytes // will get prepended to the next arrayBuffer
					return
				}
				this.destination.next(msgBytes) // send the message bytes
			}
			this.leftover = null
		} catch (err) {
			this.destination.error(err)
		}
	}
	_complete() {
		if (this.leftover) {
			const err = new TwirpErrorIntermediate(`stream finished but the last message was incomplete`)
			err.meta.method_name = method.name
			this.destination.error(err)
			return
		}
		this.destination.complete()
	}
}

//
// RxJS Observable fetch-based twirp transport
//
export default function createObservableTransport(twirpURL, options = {}) {
	const { streamingRespMethods, fetchOptions } = options
	return function observableTwirpRPC(method, requestCtor, responseCtor, request, rpcFetchOptions = {}) {
		const req = requestCtor.encode(request).finish()
		const endpoint = `${twirpURL}/${method.name}`
		const isStreamingResp = streamingRespMethods && streamingRespMethods.includes(method.name)

		// Construct the pipeline
		const pipe = []
		pipe.push(map(buf => new Uint8Array(buf)))
		if (isStreamingResp) { pipe.push(splitTwirpMessages) }
		pipe.push(map(resp => {
			const rr = responseCtor.decode(resp)
			return rr
		}))

		// Send off the request
		return new FetchObservable(endpoint, req, {
			isStreamingRespResp: isStreamingResp,
			method_name: method.name,
			fetchOptions: Object.assign({}, fetchOptions, rpcFetchOptions),
		}).pipe(...pipe)
	}
}

class FetchObservable extends Observable {
	constructor(endpoint, request, options = {}) {
		super()
		// TODO: Validate endpoint and request
		const { isStreamingRespResp, method_name, fetchOptions } = options
		this.subscriberOpts = {
			endpoint, request, isStreamingRespResp, method_name, fetchOptions,
		}
	}
	_subscribe(destination) {
		return new FetchSubscriber(destination, this.subscriberOpts)
	}
}
class FetchSubscriber extends Subscriber {
	constructor(destination, options) {
		super(destination)
		const { endpoint, request, fetchOptions } = options
		this.abortController = new AbortController()
		const fetchRequest = Object.assign({
			method: 'POST',
			headers: { 'Content-Type': 'application/protobuf' },
			body: request,
			signal: this.abortController.signal,
		}, fetchOptions)
		this.send.bind(this)(endpoint, fetchRequest, options)
	}

	unsubscribe() {
		this.abortController.abort()
		super.unsubscribe()
	}

	async send(endpoint, fetchRequest, options) {
		const { isStreamingRespResp, method_name } = options
		let resp = null
		try {
			resp = await fetch(endpoint, fetchRequest)
		} catch (err) {
			const ee = new TwirpError({
				msg: `fetch failed: ${err.message}`,
				meta: { method_name, cause: err },
				code: ERROR_CODES.TRANSPORT,
			})
			this.error(ee)
			return
		}

		if (resp.status !== 200) {
			let err
			try {
				err = await resp.json()
				err = new TwirpError(err)
			} catch (jerr) {
				err = new TwirpErrorIntermediate(`unable to parse twirp error: ${jerr.message}`, { cause: jerr })
			}
			err.meta.method_name = method_name
			this.error(err)
			return
		}

		try {
			if (!isStreamingRespResp) {
				const buf = await resp.arrayBuffer()
				this.next(buf)
				this.complete()
				return
			}

			if (!resp.body || typeof resp.body.getReader !== 'function') {
				const err = new TwirpError({
					msg: 'support for streaming responses requires Response.body.getReader to be implemented',
					meta: { method_name },
					code: ERROR_CODES.TRANSPORT,
				})
				this.error(err)
				return
			}
			const reader = resp.body.getReader()
			let msg = {}
			while (!msg.done || !!msg.value) {
				msg = await reader.read()
				this.next(msg.value)
			}
			this.complete()
		} catch (err) {
			if (err.name === 'AbortError') {
				// it was intentional, so complete anyway
				this.complete()
				return
			}
			const ee = new TwirpErrorIntermediate({
				msg: err.message,
				meta: { method_name },
			})
			this.error(err)
		}
	}
}

//
// RxJS Observable XHR-based twirp transport
// Uses deprecated moz-chunked-arraybuffer responseType with a forked version of AjaxObservable
//
export function createObservableXHRTransport(twirpURL, options = {}) {
	const { streamingRespMethods, ajaxOptions } = options
	return function observableXHRTwirpRPC(method, requestCtor, responseCtor, request, rpcAjaxOpts) {
		const req = requestCtor.encode(request).finish()
		const endpoint = `${twirpURL}/${method.name}`
		const isStreamingResp = streamingRespMethods && streamingRespMethods.includes(method.name)

		// Construct the pipeline
		const pipe = []
		pipe.push(checkXHRStatus)
		pipe.push(map(resp => new Uint8Array(resp.response)))
		if (isStreamingResp) { pipe.push(splitTwirpMessages) }
		pipe.push(map(resp => responseCtor.decode(resp)))

		const ajaxReq = Object.assign(
			{
				method: 'POST',
				url: endpoint,
				body: req,
				headers: { 'Content-Type': 'application/protobuf' },
				responseType: isStreamingResp ? 'moz-chunked-arraybuffer' : 'arraybuffer',
			},
			ajaxOptions,
			rpcAjaxOpts,
		)
		return new AjaxObservable(ajaxReq).pipe(...pipe)
	}
}

const checkXHRStatus = source => new Observable(sink => {
	return source.subscribe(
		resp => {
			if (resp.status === 200) {
				// ll('All good', resp)
				return sink.next(resp)
			} // All good, move on
			if (resp.xhr.errorText) { // We didn't make contact with the server
				// ll('Got xhr error with nice text?', resp.xhr.errorText)
				return sink.error(new TwirpErrorIntermediate(resp.xhr.errorText, { status: resp.status }))
			}
			let err = parseTwirpError(new Uint8Array(resp.response))
			if (err === STREAMING.EOF) {
				err = new TwirpErrorIntermediate('Unexpected EOF', { status: resp.status })
			}
			sink.error(err)
		},
		err => {
			sink.error(new TwirpError({
				msg: err.message,
				code: ERROR_CODES.TRANSPORT,
				meta: { cause: err },
			}))
		},
		() => { sink.complete() }, // passing sink.complete directly doesn't work for some reason
	)
})
