//
//  GBXTwirp.swift
//  GBXTwirp
//
//  Copyright © 2018 MyGnar, Inc. All rights reserved.
//

import Foundation
import RxSwift
import SwiftProtobuf

// TODO: Get a proper GBXTwirpError implementation going because these errors are out of control

// // Example client implementation (can be generated from proto file):
//
// 	public class HaberdasherClient: NSObject {
// 		public static let protoNamespace = "tbd"
// 		public static let protoService = "TBD"
// 		private let url: String
//
// 		public init(url: String) {
// 			self.url = url + "/twirp/twitch.twirp.example.Haberdasher"
// 			super.init()
// 		}
//
// 		func makeHat(_ req: Haberdasher_Size) -> Observable<Haberdasher_Hat> {
// 			let url = self.url + "/MakeHat";
// 			let ioSched = SerialDispatchQueueScheduler(qos: .background)
// 			return GBXTwirp().twirp(url: url, reqMsg: req, isRespStreaming: false)
// 				.subscribeOn(ioSched)
// 				.decodeMessage(Haberdasher_Hat.self)
// 		}
//
// 		func makeHats(_ req: Haberdasher_MakeHatsReq) -> Observable<Haberdasher_Hat> {
// 			let url = self.url + "/MakeHats";
// 			let ioSched = SerialDispatchQueueScheduler(qos: .background)
// 			return GBXTwirp().twirp(url: url, reqMsg: req, isRespStreaming: true)
// 				.subscribeOn(ioSched)
// 				.decodeMessage(Haberdasher_Hat.self)
// 		}
// 	}
//
// // Example client usage:
//
// 	func testMakeHat() -> Void {
// 		var hatSize = Haberdasher_Size()
// 		hatSize.inches = 10
// 		let habClient = HaberdasherClient(url: "http://localhost:8080")
// 		habClient.makeHat(hatSize).subscribe { event init() {
// 			switch event {
// 				case .next(let hat):
// 					print("Got a hat:", hat.name, hat.color, hat.size)
// 				case .error(let err):
// 					print("makeHat failed:", err)
// 				case .completed:
// 					print("makeHat completed")
// 			}
// 		}}
// 	}


// The decodeMessage operator converts protobuf-encoded messages native types
extension ObservableType {
	func decodeMessage<M: Message>(_ _: M.Type) -> Observable<M> {
		return Observable.create { observer in
			return self.subscribe { event in
				let TAG = "decodeMessage"
				//print(TAG, "event", event)
				switch event {
				case .next(let val):
					guard let msgBytes = val as? Data else {
						observer.on(.error(NSError(domain: "GBXTwirp", code: 464, userInfo: [NSLocalizedDescriptionKey: "joinSplitMessages only accepts Data"])))
						return
					}
					if msgBytes.count == 0 {
						observer.on(.error(NSError(domain: "GBXTwirp", code: 465, userInfo: [NSLocalizedDescriptionKey: "received an empty Data"])))
						return
					}
					do {
						//print(TAG, "NEXT", "Decoding msgBytes: ", msgBytes)
						let resp = try M(serializedData: msgBytes)
						observer.on(.next(resp))
						return
					} catch let err {
						print(TAG, "ERROR", "Unable to decode message:", err)
						let meta: [String: String] = ["cause": err.localizedDescription]
						observer.on(.error(NSError(
							domain: "GBXTwirp",
							code: -1234,
							userInfo: [
								NSLocalizedDescriptionKey: "Unable to decode response",
								"code": "internal",
								"meta": meta as Any,
							]
						)))
						return
					}
				case .error(let err):
					observer.on(.error(err))
				case .completed:
					observer.on(.completed)
				}
			}
		}
	}
} // end decodeMessage operator

class GBXTwirp: NSObject, URLSessionDelegate, URLSessionDataDelegate {
	private static var taskID: Int = 0

	private let TAG = "GBXTwirp"
	private let MESSAGE_TAG: UInt64 = (1 << 3) | 2
	private let TRAILER_TAG: UInt64 = (2 << 3) | 2

	private var session: URLSession! = nil
	private var dataTask: URLSessionDataTask! = nil
	private var isRunning: Bool = false
	private var observer: AnyObserver<Data>?
	private var disposer: Cancelable?
	private var leftover: Data?
	private var isRespStreaming: Bool?
	private var completed: Bool = false
	private var queue: DispatchQueue! = nil
	private var chunkID: Int = 0

	override init() {
		super.init()
		GBXTwirp.taskID += 1
		self.queue = DispatchQueue(label: "GBXTwirp-\(GBXTwirp.taskID)")
		let config = URLSessionConfiguration.default
		config.requestCachePolicy = .reloadIgnoringLocalCacheData
		config.timeoutIntervalForRequest = Double.infinity
		self.session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
	}

	func twirp(url: String, reqMsg: Message, isRespStreaming: Bool) -> Observable<Data> {
		let FUNC = "(twirp)"
		if self.isRunning {
			return Observable.error(NSError(
				domain: "GBXTwirp",
				code: -543,
				userInfo: [NSLocalizedDescriptionKey: "This GBXTwirp instance is busy with a previous twirp", "code": "busy"]
			))
		}
		self.isRunning = true
		self.isRespStreaming = isRespStreaming
		self.completed = false
		self.leftover = nil

		return Observable.create { observer in
			print(self.TAG, FUNC, "Twirping", url)
			var req = URLRequest(url: URL(string: url)!)
			req.httpMethod = "POST"
			req.setValue("application/protobuf", forHTTPHeaderField: "Content-Type")
			req.httpBody = try? reqMsg.serializedData()
			self.observer = observer
			self.dataTask = self.session.dataTask(with: req)
			self.disposer = Disposables.create {
				//print(self.TAG, FUNC, "Disposing twirp task")
				self.completed = true
				self.dataTask.cancel()
				self.isRunning = false
			}
			self.dataTask.resume()
			return self.disposer!
		}
	} // end twirp

	func cancel() {
		if self.disposer!.isDisposed { return }
		self.disposer!.dispose()
	}

	//
	// URLSessionDelegate methods
	//
	func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
		let FUNC = "(didCompleteWithError)"
		if let err = error as NSError? {
			if err.domain == NSURLErrorDomain && err.code == -999 && self.completed { // cancelled
				print(self.TAG, FUNC, "Request cancelled")
				return
			}
			print(self.TAG, FUNC, "ERROR", err)
			self.observer!.on(.error(err))
			return
		}
		//print(self.TAG, FUNC, "COMPLETED")
		//// TODO: Error if we've got leftovers hanging
		//if self.leftover != nil { }
	}

	func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse, completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
		//print(self.TAG, "(didReceiveHeaders)", response as Any)
		completionHandler(.allow)
	}

	func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
		self.chunkID += 1
		let cid = self.chunkID
		let FUNC = "(didReceiveData \(cid))"
		if self.disposer!.isDisposed {
			print(self.TAG, FUNC, "ERROR", "Received data after subscription has been disposed")
			return
		}
		if data.isEmpty {
			print(self.TAG, FUNC, "ERROR", "Received empty response")
			self.observer!.on(.error(NSError(
				domain: self.TAG,
				code: 460,
				userInfo: [NSLocalizedDescriptionKey: "Received an empty response", "code": "internal"]
			)))
			return
		}

		let resp = dataTask.response as? HTTPURLResponse
		if resp == nil {
			print(self.TAG, FUNC, "ERROR", "Task is missing response?", dataTask.response as Any)
			self.observer!.on(.error(NSError(
				domain: self.TAG,
				code: 461,
				userInfo: [NSLocalizedDescriptionKey: "Reponse is not HTTP?", "code": "internal"]
			)))
			return
		}
		if resp!.statusCode != 200 { // JSON-encoded twirp error
			struct Twerr: Decodable {
				var msg = "Uninitialized error"
				var code = "unknown"
				var meta: [String: String]?
			}
			do { // TODO: create func decodeTwirpError
				let err: Twerr = try JSONDecoder().decode(Twerr.self, from: data)
				print(self.TAG, FUNC, "ERROR", "Received error:", err)
				self.observer!.on(.error(NSError(
					domain: self.TAG,
					code: 462,
					userInfo: [NSLocalizedDescriptionKey: err.msg, "code": err.code, "meta": err.meta as Any]
				)))
				return
			} catch let err {
				print(self.TAG, FUNC, "ERROR", "Received error but can't decode it", err, String(data: data, encoding: .utf8) as Any)
				let meta: [String: String] = ["rawErr": String(data: data, encoding: .utf8)!]
				self.observer!.on(.error(NSError(
					domain: self.TAG,
					code: 463,
					userInfo: [NSLocalizedDescriptionKey: "Received a twirp error but can't decode it", "code": "internal", "meta": meta as Any]
				)))
			}
			return
		}

		if !self.isRespStreaming! {
			self.observer!.on(.next(data))
			self.observer!.on(.completed)
			return
		}

		// This is a stream

		// Backpressure:
		//   Hold up while we decode the messages, otherwise the task will keep downloading data
		//   into an in-memory buffer, eventually crippling the app if the buffer grows too large
		//   TODO: Make this configurable with an option flag as only high-load streams require backpressure
		dataTask.suspend()

		// Queue handling of this batch of data
		self.queue.sync {
			// Prepend any leftover data from previous messages
			let dd: Data
			if self.leftover != nil {
				dd = Data(count: data.count + self.leftover!.count)
				dd.withUnsafeMutableBytes({ (bytes: UnsafeMutablePointer<UInt8>) in
					self.leftover!.copyBytes(to: bytes, count: self.leftover!.count)
					data.copyBytes(to: bytes+self.leftover!.count, count: data.count)
				})
				self.leftover = nil
			} else {
				dd = data
			}

			self.extractMessages(dd, chunkID: cid)
			//print(self.TAG, FUNC, "Extracted messages!", dd)
			dataTask.resume()
		}

	} // end urlSession didReceive data

	func extractMessages(_ data: Data, chunkID: Int) {
		let FUNC = "(extractMessages \(chunkID))"
		let dataCount = data.count
		data.withUnsafeBytes { (pointer: UnsafePointer<UInt8>) in
			var decoder = SwiftProtobuf.BinaryDecoder(
				forReadingFrom: pointer,
				count: dataCount,
				options: BinaryDecodingOptions(),
				extensions: nil
			)
			while true {
				let fieldStart = dataCount - decoder.available
				decoder.fieldWireFormat = WireFormat.varint
				let fieldTag = try? decoder.decodeVarint()

				if fieldTag != TRAILER_TAG && fieldTag != MESSAGE_TAG {
					print(TAG, FUNC, "ERROR", "Not a valid twirp message.", "fieldTag", fieldTag as Any)
					let meta: [String: String] = [
						"cause": "Data does not begin with a valid field tag",
						"fieldTag": String(describing: fieldTag),
					]
					self.observer!.on(.error(NSError(
						domain: self.TAG,
						code: 321,
						userInfo: [
							NSLocalizedDescriptionKey: "Not a valid twirp stream response",
							"code": "internal",
							"meta": meta as Any,
						]
					)))
					return
				}
				//print(TAG, FUNC, "Extracting next message, starting at \(fieldStart) with tag \(data[fieldStart]) ((trailer=\(TRAILER_TAG) msg=\(MESSAGE_TAG) thisTag=\(fieldTag)))")

				if fieldTag == TRAILER_TAG {
					//print(TAG, FUNC, "TRAILER", "Got a trailer. Bytes left = ", decoder.available)
					decoder.fieldWireFormat = WireFormat.lengthDelimited
					var trailerStr = "{\"msg\":\"Unknown failure while decoding server error\",\"code\":\"internal\"}"
					do {
						try decoder.decodeSingularStringField(value: &trailerStr)
					} catch let err {
						print(TAG, FUNC, "ERROR", "Unable to decode trailer", err)
						let meta: [String: String] = [
							"cause": err.localizedDescription,
							"fieldTag": String(describing: fieldTag),
						]
						self.observer!.on(.error(NSError(
							domain: self.TAG,
							code: 456,
							userInfo: [
								NSLocalizedDescriptionKey: "Unable to decode trailer",
								"code": "internal",
								"meta": meta as Any
							]
						)))
						return
					}
					if trailerStr == "EOF" {
						//print(TAG, FUNC, "COMPLETED", trailerStr)
						self.observer!.on(.completed)
						return
					}
					// TODO: create and use func decodeTwirpError
					struct Twerr: Decodable {
						var msg = "Uninitialized error"
						var code = "unknown"
						var meta: [String: String]?
					}
					do {
						let err: Twerr = try JSONDecoder().decode(Twerr.self, from: trailerStr.data(using: .utf8)!)
						print(TAG, FUNC, "ERROR", "Received error:", err)
						self.observer!.on(.error(NSError(
							domain: self.TAG,
							code: 457,
							userInfo: [
								NSLocalizedDescriptionKey: err.msg,
								"code": err.code,
								"meta": err.meta as Any
							]
						)))
						return
					} catch let err {
						print(TAG, FUNC, "ERROR", "Received error but can't decode it", err, trailerStr)
						let meta: [String: String] = [
							"cause": err.localizedDescription,
							"rawErr": trailerStr,
						]
						self.observer!.on(.error(NSError(
							domain: self.TAG,
							code: 458,
							userInfo: [
								NSLocalizedDescriptionKey: "Received a malformed error",
								"code": "internal",
								"meta": meta as Any
							]
						)))
						return
					}
				} // end trailer

				// Received a twirp stream response message
				do {
					//print(TAG, FUNC, "MESSAGE")
					let msgLen = try decoder.decodeVarint()
					let msgStart = dataCount - decoder.available
					let msgEnd = msgStart + Int(msgLen)
					let missing = Int(msgLen) - decoder.available
					if missing > 0 {
						//print(TAG, FUNC, "INCOMPLETE MESSAGE", "Message is missing \(missing) bytes")
						var dataCopy = Data(count: dataCount - fieldStart)
						dataCopy.withUnsafeMutableBytes({ (bytes: UnsafeMutablePointer<UInt8>) in
							data[fieldStart..<dataCount].copyBytes(to: bytes, count: dataCount - fieldStart)
						})
						self.leftover = dataCopy
						// self.leftover = data[fieldStart..<dataCount]
						return
					}

					//print(TAG, FUNC, "Calling NEXT with \(msgLen) bytes", "dataCount=\(dataCount) msgStart=\(msgStart) msgEnd=\(msgEnd) extraLen=\(dataCount - msgEnd) missing=\(missing) decoder.available=\(decoder.available) availableMinusCount=\(decoder.available - dataCount)")
					self.observer!.on(.next(data[msgStart..<msgEnd]))
					if missing == 0 {
						return
					}

					decoder.p += Int(msgLen)
					decoder.available -= Int(msgLen)
					//print(TAG, FUNC, "COMPOUND MESSAGE", "Message has \(-missing) extra bytes -- dataCount=\(dataCount) msgStart=\(msgStart) msgEnd=\(msgEnd) copyLen=\(dataCount - msgEnd) first=\(data[msgEnd])")
					continue

				} catch let err {
					print(TAG, FUNC, "ERROR", "Unable to decode message:", err)
					let meta: [String: String] = ["cause": err.localizedDescription]
					self.observer!.on(.error(NSError(
						domain: self.TAG,
						code: 459,
						userInfo: [
							NSLocalizedDescriptionKey: "Unable to decode response",
							"code": "internal",
							"meta": meta as Any,
						]
					)))
					return
				}

			} // end while true
		} // end dd.withUnsafeBytes
	} // end extractMessages

} // end class GBXTwirp
