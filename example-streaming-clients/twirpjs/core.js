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

import { rpc } from 'protobufjs/minimal'

// TODO: Rename generator to factory throughout?

// TwirpJS transports override protobuf.js's implementation of "rpcCall", the original implementation
// is saved as the transport type 'ORIGINAL' and requires use of the createRpcImpl option
const ORIGINAL = 'ORIGINAL'
export const TransportGenerators = {
	[ORIGINAL]: (origRpcCall => {
		return (twirpURL, opts) => origRpcCall
	})(rpc.Service.prototype.rpcCall), // capture rpcCall in case it gets altered
}
export const TRANSPORT_TYPES = { ORIGINAL }
TRANSPORT_TYPES.DEFAULT = ORIGINAL // can be overridden by RegisterTransportGenerator()

// Register a TransportGenerator
// Generator signature: (twirpURL, options) => (method, requestCtor, responseCtor, request, callback)
//   * "request" and "callback" are the first and second arguments passed to a client rpc method
//     Note that the callback argument does not need to actually be a callback -- a transport could
//     define an alternate use for the callback argument where it is an options object or anything else
//   * "method", "requestCtor", and "responseCtor" are provided by protobuf.js internals
export function registerTransportGenerator({ name, generator, setAsDefault }) {
	if (TRANSPORT_TYPES[name] === name) {
		throw new Error(`A twirpjs transport generator has already been registered for the type ${name}`)
	}
	TRANSPORT_TYPES[name] = name
	if (setAsDefault) {
		TRANSPORT_TYPES.DEFAULT = name
	}
	TransportGenerators[name] = generator
}

export default function newTwirpClient(hostURL, options = {}) {
	const {
		serviceRoute,  // required
		serviceClass,  // required
		transportType, // (optional) one of TRANSPORT_TYPES
		createRpcImpl, // required when using TRANSPORT_TYPE.ORIGINAL (protobuf.js-style transport)
	} = options
	const twirpURL = `${hostURL}/twirp/${serviceRoute}`
	const rpcImpl =
		typeof createRpcImpl === 'function'
			? createRpcImpl(twirpURL, options)
			: () => {
					throw new Error(
						`Current transport type ${transportType || 'DEFAULT'} requires the createRpcImpl option`,
					)
				}
	const client = serviceClass.create(rpcImpl, /* req delimited */ false, /* resp delimited */ false)
	client.rpcCall = getRpcCall(twirpURL, options) // Override protobuf.js's implementation of rpcCall
	return client
}

function getRpcCall(twirpURL, opts = {}) {
	const { transportType } = opts
	const tt = transportType || TRANSPORT_TYPES.DEFAULT
	if (typeof TransportGenerators[tt] !== 'function') {
		throw new Error(`Unsupported rpc transport type: ${tt}`)
	}
	return TransportGenerators[tt](twirpURL, opts)
}
