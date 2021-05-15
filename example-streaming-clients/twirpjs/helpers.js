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

// Debugging helpers - hex stringifiers
export const toHex = x => '0x' + ('00' + x.toString(16)).slice(-2)
export const toHexArray = arr => Array.prototype.map.call(arr, ToHex).join(' ')

// XHR status-to-string and string-to-status map
const XHR_READYSTATE = {}
for (let kk of ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE']) {
	XHR_READYSTATE[XMLHttpRequest[kk]] = kk
	XHR_READYSTATE[kk] = XMLHttpRequest[kk]
}
export { XHR_READYSTATE }

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
		} else if (msg && message) {
			super(`Badly formed twirp error: cannot have both msg and message fields, got msg="${msg}" and message="${message}"`)
		} else {
			super(msg || message)
		}
		this.name = this.constructor.name
		this.meta = {} // ensure meta property exists, incase twerrObj is a generic error.
		for (const kk of Object.keys(twerrObj)) {
			this[kk] = twerrObj[kk]
		}
	}
}

export class TwirpErrorIntermediate extends TwirpError {
	constructor(msg, meta = {}) {
		super({ msg, meta, code: ERROR_CODES.INTERNAL })
	}
}
