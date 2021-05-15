// Original work Copyright (c) 2015-2018 Google, Inc., Netflix, Inc., Microsoft Corp. and contributors
// Modified work Copyright (c) 2018 MyGnar, Inc.
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

// Forked from http://reactivex.io/rxjs/file/es6/observable/dom/AjaxObservable.js.html
// This implementation adds support for the moz-chunked-arraybuffer responseType
// It also doesn't error on non-2xx status codes, leaving it to downstream consumers
// to check the status and handle accordingly

import { Observable, Subscriber } from 'rxjs'
import { map } from 'rxjs/operators'
import { tryCatch, errorObject, root } from 'rxjs/internal-compatibility'

function getCORSRequest() {
    if (root.XMLHttpRequest) {
        return new root.XMLHttpRequest();
    }
    else if (!!root.XDomainRequest) {
        return new root.XDomainRequest();
    }
    else {
        throw new Error('CORS is not supported by your browser');
    }
}
function getXMLHttpRequest() {
    if (root.XMLHttpRequest) {
        return new root.XMLHttpRequest();
    }
    else {
        let progId;
        try {
            const progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
            for (let i = 0; i < 3; i++) {
                try {
                    progId = progIds[i];
                    if (new root.ActiveXObject(progId)) {
                        break;
                    }
                }
                catch (e) {
                }
            }
            return new root.ActiveXObject(progId);
        }
        catch (e) {
            throw new Error('XMLHttpRequest is not supported by your browser');
        }
    }
}


export function ajaxGet(url, headers = null) {
	return new AjaxObservable({ method: 'GET', url, headers })
}
export function ajaxPost(url, body, headers) {
	return new AjaxObservable({ method: 'POST', url, body, headers })
}
export function ajaxDelete(url, headers) {
	return new AjaxObservable({ method: 'DELETE', url, headers })
}
export function ajaxPut(url, body, headers) {
	return new AjaxObservable({ method: 'PUT', url, body, headers })
}
export function ajaxPatch(url, body, headers) {
	return new AjaxObservable({ method: 'PATCH', url, body, headers })
}
const mapResponse = map((x, index) => x.response)
export function ajaxGetJSON(url, headers) {
	return mapResponse(
		new AjaxObservable({
			method: 'GET',
			url,
			responseType: 'json',
			headers,
		}),
	)
}

/**
 * We need this JSDoc comment for affecting ESDoc.
 * @extends {Ignored}
 * @hide true
 */
export class AjaxObservable extends Observable {
	constructor(urlOrRequest) {
		super()
		const request = {
			async: true,
			createXHR: function() {
				return this.crossDomain ? getCORSRequest.call(this) : getXMLHttpRequest();
				// return new XMLHttpRequest()
			},
			crossDomain: false,
			withCredentials: false,
			headers: {},
			method: 'GET',
			responseType: 'arraybuffer',
			timeout: 0,
		}
		if (typeof urlOrRequest === 'string') {
			request.url = urlOrRequest
		} else {
			for (const prop in urlOrRequest) {
				if (urlOrRequest.hasOwnProperty(prop)) {
					request[prop] = urlOrRequest[prop]
				}
			}
		}
		this.request = request
	}
	_subscribe(subscriber) {
		return new AjaxSubscriber(subscriber, this.request)
	}
}

/**
 * Creates an observable for an Ajax request with either a request object with
 * url, headers, etc or a string for a URL.
 *
 * @example
 * source = Rx.Observable.ajax('/products');
 * source = Rx.Observable.ajax({ url: 'products', method: 'GET' });
 *
 * @param {string|Object} request Can be one of the following:
 *   A string of the URL to make the Ajax call.
 *   An object with the following properties
 *   - url: URL of the request
 *   - body: The body of the request
 *   - method: Method of the request, such as GET, POST, PUT, PATCH, DELETE
 *   - async: Whether the request is async
 *   - headers: Optional headers
 *   - crossDomain: true if a cross domain request, else false
 *   - createXHR: a function to override if you need to use an alternate
 *   XMLHttpRequest implementation.
 *   - resultSelector: a function to use to alter the output value type of
 *   the Observable. Gets {@link AjaxResponse} as an argument.
 * @return {Observable} An observable sequence containing the XMLHttpRequest.
 * @static true
 * @name ajax
 * @owner Observable
 */
AjaxObservable.create = (() => {
	const create = urlOrRequest => {
		return new AjaxObservable(urlOrRequest)
	}
	create.get = ajaxGet
	create.post = ajaxPost
	create.delete = ajaxDelete
	create.put = ajaxPut
	create.patch = ajaxPatch
	create.getJSON = ajaxGetJSON
	return create
})()

/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
export class AjaxSubscriber extends Subscriber {
	constructor(destination, request) {
		super(destination)
		this.request = request
		this.done = false
		const headers = (request.headers = request.headers || {})
		// force CORS if requested
		if (!request.crossDomain && !headers['X-Requested-With']) {
			headers['X-Requested-With'] = 'XMLHttpRequest'
		}
		// ensure content type is set
		if (
			!('Content-Type' in headers) &&
			!(root.FormData && request.body instanceof root.FormData) &&
			typeof request.body !== 'undefined'
		) {
			headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
		}
		// properly serialize body
		request.body = this.serializeBody(request.body, request.headers['Content-Type'])
		this.send()
	}

	next(e) {
		const { xhr, request, destination } = this
		const response = new AjaxResponse(e, xhr, request)
		// console.log('<AJAX_XHR_OBSV>', '(next)', 'response:', response)
		destination.next(response)
	}

	send() {
		const { request, request: { user, method, url, async, password, headers, body } } = this
		const createXHR = request.createXHR
		const xhr = tryCatch(createXHR).call(request)
		if (xhr === errorObject) {
			this.error(errorObject.e)
		} else {
			this.xhr = xhr
			// set up the events before open XHR
			// https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
			// You need to add the event listeners before calling open() on the request.
			// Otherwise the progress events will not fire.
			this.setupEvents(xhr, request)
			// open XHR
			let result
			if (user) {
				result = tryCatch(xhr.open).call(xhr, method, url, async, user, password)
			} else {
				result = tryCatch(xhr.open).call(xhr, method, url, async)
			}
			if (result === errorObject) {
				this.error(errorObject.e)
				return null
			}
			// timeout, responseType and withCredentials can be set once the XHR is open
			if (async) {
				xhr.timeout = request.timeout
				xhr.responseType = request.responseType
			}
			if ('withCredentials' in xhr) {
				xhr.withCredentials = !!request.withCredentials
			}
			// set headers
			this.setHeaders(xhr, headers)
			// finally send the request
			result = body ? tryCatch(xhr.send).call(xhr, body) : tryCatch(xhr.send).call(xhr)
			if (result === errorObject) {
				this.error(errorObject.e)
				return null
			}
		}
		return xhr
	}

	serializeBody(body, contentType) {
		if (!body || typeof body === 'string') {
			return body
		} else if (root.FormData && body instanceof root.FormData) {
			return body
		}
		if (contentType) {
			const splitIndex = contentType.indexOf(';')
			if (splitIndex !== -1) {
				contentType = contentType.substring(0, splitIndex)
			}
		}
		switch (contentType) {
			case 'application/x-www-form-urlencoded':
				return Object.keys(body)
					.map(key => `${encodeURI(key)}=${encodeURI(body[key])}`)
					.join('&')
			case 'application/json':
				return JSON.stringify(body)
			default:
				return body
		}
	}

	setHeaders(xhr, headers) {
		for (let key in headers) {
			if (headers.hasOwnProperty(key)) {
				xhr.setRequestHeader(key, headers[key])
			}
		}
	}

	setupEvents(xhr, request) {
		const progressSubscriber = request.progressSubscriber
		function xhrTimeout(e) {
			const { subscriber, progressSubscriber, request } = xhrTimeout
			if (progressSubscriber) {
				progressSubscriber.error(e)
			}
			subscriber.error(new AjaxTimeoutError(this, request)) //TODO: Make betterer.
		}
		xhr.ontimeout = xhrTimeout
		xhrTimeout.request = request
		xhrTimeout.subscriber = this
		xhrTimeout.progressSubscriber = progressSubscriber

		if (xhr.upload && 'withCredentials' in xhr) {
			if (progressSubscriber) {
				let xhrProgress
				xhrProgress = function(e) {
					const { progressSubscriber } = xhrProgress
					progressSubscriber.next(e)
				}
				if (root.XDomainRequest) {
					xhr.onprogress = xhrProgress
				} else {
					xhr.upload.onprogress = xhrProgress
				}
				xhrProgress.progressSubscriber = progressSubscriber
			}
			let xhrError
			xhrError = function(e) {
				const { progressSubscriber, subscriber, request } = xhrError
				if (progressSubscriber) {
					progressSubscriber.error(e)
				}
				subscriber.error(new AjaxError('ajax error', this, request))
			}
			xhr.onerror = xhrError
			xhrError.request = request
			xhrError.subscriber = this
			xhrError.progressSubscriber = progressSubscriber
		}

		function xhrReadyStateChange(e) {
			const { subscriber, progressSubscriber, request } = xhrReadyStateChange
			// console.log('<AJAX_XHR_OBSV>', 'readyStateChange', { readyState: this.readyState, status: this.status })
			if (this.readyState === 3 && xhr.responseType === 'moz-chunked-arraybuffer') {
				// Received an incremental response
				subscriber.next(e) // send the ArrayBuffer
				return
			}
			if (this.readyState !== 4 || subscriber.done) {
				return
			}
			// normalize IE9 bug (http://bugs.jquery.com/ticket/1450)
			let status = this.status === 1223 ? 204 : this.status
			let response = this.responseType === 'text' ? this.response || this.responseText : this.response
			// fix status code when it is 0 (0 status is undocumented).
			// Occurs when accessing file resources or on Android 4.1 stock browser
			// while retrieving files from application cache.
			if (status === 0) {
				status = response ? 200 : 0
			}
			// console.log('<AJAX_XHR_OBSV>', 'marking subscriber as done', { status })
			subscriber.done = true
			if (progressSubscriber) {
				progressSubscriber.complete()
			}
			subscriber.next(e)
			subscriber.complete()
			// // We're leaving it up to downstream consumer to check status for errors
			// if (200 <= status && status < 300) {
			// 	if (progressSubscriber) {
			// 		progressSubscriber.complete()
			// 	}
			// 	// console.log('<AJAX_XHR_OBSV>', 'sending last next with:', e)
			// 	subscriber.next(e)
			// 	// console.log('<AJAX_XHR_OBSV>', 'completing subscriber')
			// 	subscriber.complete()
			// 	// console.log('<AJAX_XHR_OBSV>', 'subscriber completed')
			// } else {
			// 	if (progressSubscriber) {
			// 		progressSubscriber.error(e)
			// 	}
			// 	// FIXME: make more twirp-friendly?
			// 	subscriber.error(new AjaxError('ajax error ' + status, this, request))
			// }
		}

		xhr.onreadystatechange = xhrReadyStateChange
		xhrReadyStateChange.subscriber = this
		xhrReadyStateChange.progressSubscriber = progressSubscriber
		xhrReadyStateChange.request = request
	}

	unsubscribe() {
		const { done, xhr } = this
		const { readyState, abort } = xhr || {}
		// console.log('<AJAX_XHR_OBSV>', '(unsubscribe)', { done, readyState })
		if (!done && readyState !== 4 && typeof abort === 'function') {
			// console.log('<AJAX_XHR_OBSV>', '(unsubscribe)', '!! aborting !!')
			xhr.abort()
		}
		super.unsubscribe()
	}
}

/**
 * A normalized AJAX response.
 *
 * @see {@link ajax}
 *
 * @class AjaxResponse
 */
export class AjaxResponse {
	constructor(originalEvent, xhr, request) {
		this.originalEvent = originalEvent
		this.xhr = xhr
		this.request = request
		this.status = xhr.status
		this.responseType = xhr.responseType || request.responseType
		this.response = parseXhrResponse(this.responseType, xhr)
		// console.log('<AJAX_XHR_OBSV>', '{AjaxResponse}()', { response: this.response, status: this.status })
	}
}

/**
 * A normalized AJAX error.
 *
 * @see {@link ajax}
 *
 * @class AjaxError
 */
export class AjaxError extends Error {
	constructor(message, xhr, request) {
		super(message)
		this.message = message
		this.xhr = xhr
		this.request = request
		this.status = xhr.status
		this.responseType = xhr.responseType || request.responseType
		this.response = parseXhrResponse(this.responseType, xhr)
	}
}

function parseXhrResponse(responseType, xhr) {
	switch (responseType) {
		case 'json':
			if ('response' in xhr) {
				//IE does not support json as responseType, parse it internally
				return xhr.responseType ? xhr.response : JSON.parse(xhr.response || xhr.responseText || 'null')
			} else {
				return JSON.parse(xhr.responseText || 'null')
			}
		case 'xml':
			return xhr.responseXML
		case 'text':
		default:
			return 'response' in xhr ? xhr.response : xhr.responseText
	}
}

/**
 * @see {@link ajax}
 *
 * @class AjaxTimeoutError
 */
export class AjaxTimeoutError extends AjaxError {
	constructor(xhr, request) {
		super('ajax timeout', xhr, request)
	}
}
//# sourceMappingURL=AjaxObservable.js.map
