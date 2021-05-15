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
import { concatByteArrays, extractMessages } from '../streaming'
import { IntermediateError, TwirpError, ERROR_CODES } from '../helpers'

/**
 * When using this transport, rpc calls return a promise.
 *
 *   Creating a client:
 *   	const client = new<Service>Client('<host-url>', {
 *   		// optional options
 *   		fetchOptions: {
 *   			mode: 'no-cors',
 *   		}
 *   	})
 *
 *   Usage for non-streaming (unary) endpoints:
 *   	const resp = await client.<Method>(requestObject)
 *   	console.log('Twirp server responsed with:', resp)
 *
 *   Usage for non-streaming (unary) endpoints:
 *   	await client.<Method>(requestObject, resp => console.log('Twirp server responded with:', resp))
 *   	console.log('Request completed')
 */
export default function createFetchTransport(twirpURL, options = {}) {
	const { streamingRespMethods, fetchOptions } = options

	return async function fetchTwirpRPC(method, requestCtor, responseCtor, request, callback) {
		// TODO: validate request?
		const req = requestCtor.encode(request).finish()
		const resp = await sendReqAndCheckResp(twirpURL, method, req, fetchOptions)

		// Check for a streaming endpoint
		if (!streamingRespMethods || !streamingRespMethods.includes(method.name)) {
			// This is a unary response
			const buf = await resp.arrayBuffer()
			const respContent = responseCtor.decode(new Uint8Array(buf))
			return respContent
		}

		// This is a streaming endpoint
		if (typeof callback !== 'function') {
			throw new Error(
				'twirpjs fetch transport requires a callback for streaming responses. E.g. await client.MethodName(reqObj, resp => { console.log("Received response:", resp) })',
			)
		}
		if (!resp.body || typeof resp.body.getReader !== 'function') {
			throw new Error('twirpjs fetch transport requires Response.body.getReader to be implemented')
		}
		await readFromStream(resp.body.getReader(), responseCtor, callback)
	} // end transport function
}

async function sendReqAndCheckResp(twirpURL, method, request, fetchOptions = {}) {
	const endpoint = `${twirpURL}/${method.name}`
	let resp = null
	try {
		const headers = Object.assign({ 'Content-Type': 'application/protobuf' }, fetchOptions.headers)
		delete fetchOptions.headers
		const fetchReq = Object.assign({ method: 'POST', headers, body: request, }, fetchOptions)
		resp = await fetch(endpoint, fetchReq)
	} catch (err) {
		const ee = new TwirpError({
			msg: `fetch failed: ${err.message}`,
			meta: { method_name: method.name, cause: err },
			code: ERROR_CODES.TRANSPORT,
		})
		throw ee
	}
	if (resp.status !== 200) {
		let err
		try {
			err = await resp.json()
			err = new TwirpError(err)
		} catch (jerr) {
			err = new TwirpErrorIntermediate(`unable to parse twirp error: ${jerr.message}`, { cause: jerr })
		}
		err.meta.method_name = method.name
		throw err
	}
	return resp
}

async function readFromStream(reader, responseCtor, callback) {
	while (true) {
		const msg = await reader.read()
		if (msg.done && !msg.value && !reader.leftover) { return }
		const bb = concatByteArrays(reader.leftover, msg.value) // leftover bytes get stashed on the reader
		reader.leftover = null
		for (const protoMsg of extractMessages(bb)) {
			const { msgBytes, isIncomplete } = protoMsg
			if (isIncomplete) {
				reader.leftover = msgBytes // will get prepended to the next arrayBuffer
				break
			}
			callback(responseCtor.decode(msgBytes)) // send the message bytes
		}
	}
} // end readFromStream


// /**
//  * Async generator implementation -- would be awesome but can't get babel transform working properly :(
//  */
// async function* readMessages(reader, responseCtor, callback) {
// 	try {
// 		for await (const byteArray of readFromReader(reader)) {
// 			if (!byteArray && !reader.leftover) { return }
// 			const bb = concatByteArrays(reader.leftover, byteArray) // leftover bytes get stashed on the reader
// 			reader.leftover = null
// 			for (const protoMsg of extractMessages(bb)) {
// 				const { msgBytes, isIncomplete } = protoMsg
// 				if (isIncomplete) {
// 					reader.leftover = msgBytes // will get prepended to the next arrayBuffer
// 					break
// 				}
// 				callback(responseCtor.decode(msgBytes)) // send the message bytes
// 			}
// 		}
// 	} finally {
// 		console.log('(readMessages)', 'finally!')
// 		// TODO: abort request / close reader
// 	}
// } // end readFromStream
//
// async function* readFromReader(reader) {
// 	while (true) {
// 		const msg = await reader.read()
// 		if (msg.value) { yield msg.value }
// 		if (msg.done) { return }
// 	}
// }
