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
import {
	TwirpError,
	TwirpErrorIntermediate,
	IntermediateError,
} from './helpers'

/**
 * Streaming constants. For reference see:
 *   + go client: <service>.twirp.go: protoStreamReader#Read
 *   + go server: <service>.twirp.go: <service>Server#serve<MethodName>Protobuf
 */
export const STREAMING = {
	MESSAGE_TAG: (1 << 3) | 2, // key for streaming message field #1, length-delimited
	TRAILER_TAG: (2 << 3) | 2, // key for streaming message field #2, length-delimited
	MAX_LEN:     (1 << 21),    // 1 GiB
	EOF:         'EOF',        // Trailer value signaling the end of a streaming response
}

const { MESSAGE_TAG, TRAILER_TAG, MAX_LEN, EOF } = STREAMING

export function concatByteArrays(aa, bb) {
	if (!aa || !aa.length) { return bb }
	if (!bb || !bb.length) { return aa }
	const cc = new Uint8Array(aa.length + bb.length)
	cc.set(aa, 0)
	cc.set(bb, aa.length)
	return cc
}

export function parseTwirpError(byteArray) {
	const errStr = utf8.read(byteArray, 0, byteArray.length)
	if (errStr.match(/^EOF$/)) {
		return EOF
	}
	// Received an error (presumably twerrJSON), try to parse it
	let err
	try {
		err = new TwirpError(JSON.parse(errStr))
	} catch (decodeErr) {
		err = new TwirpErrorIntermediate(
			`Unable to parse error string "${errStr}": ${decodeErr.message}`,
			{ error_string: errStr, cause: decodeErr },
		)
	}
	return err
}

/**
 * Creates a proto message with a buffer and incompleteness status
 * @param {Uint8Array} msgBytes a byte array containing a proto-encoded message
 * @param {bool} isIncomplete when true, indicates that msgBytes doesn't have all of the bytes for a complete message
 */
class ProtoMsg {
	constructor(msgBytes, isIncomplete) {
		this.msgBytes = msgBytes
		this.isIncomplete = isIncomplete
	}
}

/**
 * Yields individual protobuf messages from a twirp stream
 * @param {Uint8Array} byteArray a proto-encoded byte array containing one or more twirp stream messages
 */
export function* extractMessages(byteArray) {
	// const ll = (...args) => console.log('(extractMessages)', ...args)
	if (!byteArray || !byteArray.length) {
		// ll('Skipping empty byteArray')
		return
	}
	// ll('Processing', byteArray)
	const arrayBuf = byteArray.buffer
	const rr = new Reader(byteArray)
	rr.pos = byteArray.byteOffset // Reader doesn't check byteOffset so we set pos manually
	while (true) {
		// Process field tag
		const tagStartPos = rr.pos
		const tag = rr.int32()
		if (tag !== MESSAGE_TAG && tag !== TRAILER_TAG) {
			// Not a valid twirp stream response! Any number of things could be going wrong
			// We'this.log try decoding to a string (because what else are we going to do?)
			const errStr = utf8.read(rr.buffer, rr.pos, rr.length - rr.pos)
			throw new TwirpErrorIntermediate(
				'Received data that appears to not be part of a twirp stream',
				{ responseText: errStr },
			)
		}
		if (rr.pos >= rr.len) {
			// Dangling tag, yield it as an incomplete message and return
			// TODO: Test this!
			yield new ProtoMsg(new Uint8Array([ tag ]), true /* isIncomplete */)
			return
		}

		// Read message length
		const msgLen = rr.int32()
		const msgStartPos = rr.pos
		if (msgLen > MAX_LEN) {
			throw new TwirpErrorIntermediate(`Received a message that is way too huge (>1GiB): ${msgLen}`)
		}
		const msgEndPos = rr.pos + msgLen
		const leftInBuffer = rr.len - rr.pos
		// ll('Found message tags', { msgLen, leftInBuffer })

		// Check for incomplete message
		if (msgLen > leftInBuffer) { // Message is incomplete, yield it and return
			yield new ProtoMsg(
				new Uint8Array(arrayBuf, tagStartPos), // everything since the start of this message
				true, // isIncomplete
			)
			return
		}

		if (tag === TRAILER_TAG) {
			// Trailers are either "EOF" or a json-encoded twirp error
			const bb = new Uint8Array(arrayBuf, msgStartPos)
			const err = parseTwirpError(bb)
			if (err === EOF) {
				return // We're all done
			}
			throw err
		}

		try {
			// Decode the message and send it downstream
			yield new ProtoMsg(new Uint8Array(arrayBuf, msgStartPos, msgLen))
			rr.pos = msgEndPos // update reader position
		} catch (err) {
			throw new TwirpErrorIntermediate(
				`Unable to parse message: ${err.message}`,
				{ cause: err },
			)
		}

		if (rr.pos >= rr.len) { // that was the last message
			return
		}

		// There's some bits leftover so we're going for another loop
	}
}
