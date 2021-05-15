/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const twirper = $root.twirper = (() => {

    /**
     * Namespace twirper.
     * @exports twirper
     * @namespace
     */
    const twirper = {};

    twirper.Twirper = (function() {

        /**
         * Constructs a new Twirper service.
         * @memberof twirper
         * @classdesc Represents a Twirper
         * @extends $protobuf.rpc.Service
         * @constructor
         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
         */
        function Twirper(rpcImpl, requestDelimited, responseDelimited) {
            $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
        }

        (Twirper.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = Twirper;

        /**
         * Creates new Twirper service using the specified rpc implementation.
         * @function create
         * @memberof twirper.Twirper
         * @static
         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
         * @returns {Twirper} RPC service. Useful where requests and/or responses are streamed.
         */
        Twirper.create = function create(rpcImpl, requestDelimited, responseDelimited) {
            return new this(rpcImpl, requestDelimited, responseDelimited);
        };

        /**
         * Callback as used by {@link twirper.Twirper#Echo}.
         * @memberof twirper.Twirper
         * @typedef EchoCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {twirper.EchoReq} [response] EchoReq
         */

        /**
         * Calls Echo.
         * @function Echo
         * @memberof twirper.Twirper
         * @instance
         * @param {twirper.IEchoReq} request EchoReq message or plain object
         * @param {twirper.Twirper.EchoCallback} callback Node-style callback called with the error, if any, and EchoReq
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(Twirper.prototype.Echo = function Echo(request, callback) {
            return this.rpcCall(Echo, $root.twirper.EchoReq, $root.twirper.EchoReq, request, callback);
        }, "name", { value: "Echo" });

        /**
         * Calls Echo.
         * @function Echo
         * @memberof twirper.Twirper
         * @instance
         * @param {twirper.IEchoReq} request EchoReq message or plain object
         * @returns {Promise<twirper.EchoReq>} Promise
         * @variation 2
         */

        /**
         * Callback as used by {@link twirper.Twirper#Repeat}.
         * @memberof twirper.Twirper
         * @typedef RepeatCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {twirper.RepeatResp} [response] RepeatResp
         */

        /**
         * Calls Repeat.
         * @function Repeat
         * @memberof twirper.Twirper
         * @instance
         * @param {twirper.IRepeatReq} request RepeatReq message or plain object
         * @param {twirper.Twirper.RepeatCallback} callback Node-style callback called with the error, if any, and RepeatResp
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(Twirper.prototype.Repeat = function Repeat(request, callback) {
            return this.rpcCall(Repeat, $root.twirper.RepeatReq, $root.twirper.RepeatResp, request, callback);
        }, "name", { value: "Repeat" });

        /**
         * Calls Repeat.
         * @function Repeat
         * @memberof twirper.Twirper
         * @instance
         * @param {twirper.IRepeatReq} request RepeatReq message or plain object
         * @returns {Promise<twirper.RepeatResp>} Promise
         * @variation 2
         */

        return Twirper;
    })();

    twirper.EchoReq = (function() {

        /**
         * Properties of an EchoReq.
         * @memberof twirper
         * @interface IEchoReq
         * @property {string|null} [Message] EchoReq Message
         */

        /**
         * Constructs a new EchoReq.
         * @memberof twirper
         * @classdesc Represents an EchoReq.
         * @implements IEchoReq
         * @constructor
         * @param {twirper.IEchoReq=} [properties] Properties to set
         */
        function EchoReq(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EchoReq Message.
         * @member {string} Message
         * @memberof twirper.EchoReq
         * @instance
         */
        EchoReq.prototype.Message = "";

        /**
         * Creates a new EchoReq instance using the specified properties.
         * @function create
         * @memberof twirper.EchoReq
         * @static
         * @param {twirper.IEchoReq=} [properties] Properties to set
         * @returns {twirper.EchoReq} EchoReq instance
         */
        EchoReq.create = function create(properties) {
            return new EchoReq(properties);
        };

        /**
         * Encodes the specified EchoReq message. Does not implicitly {@link twirper.EchoReq.verify|verify} messages.
         * @function encode
         * @memberof twirper.EchoReq
         * @static
         * @param {twirper.IEchoReq} message EchoReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EchoReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Message != null && message.hasOwnProperty("Message"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.Message);
            return writer;
        };

        /**
         * Encodes the specified EchoReq message, length delimited. Does not implicitly {@link twirper.EchoReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof twirper.EchoReq
         * @static
         * @param {twirper.IEchoReq} message EchoReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EchoReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an EchoReq message from the specified reader or buffer.
         * @function decode
         * @memberof twirper.EchoReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {twirper.EchoReq} EchoReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EchoReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.twirper.EchoReq();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Message = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an EchoReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof twirper.EchoReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {twirper.EchoReq} EchoReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EchoReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EchoReq message.
         * @function verify
         * @memberof twirper.EchoReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EchoReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Message != null && message.hasOwnProperty("Message"))
                if (!$util.isString(message.Message))
                    return "Message: string expected";
            return null;
        };

        /**
         * Creates an EchoReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof twirper.EchoReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {twirper.EchoReq} EchoReq
         */
        EchoReq.fromObject = function fromObject(object) {
            if (object instanceof $root.twirper.EchoReq)
                return object;
            let message = new $root.twirper.EchoReq();
            if (object.Message != null)
                message.Message = String(object.Message);
            return message;
        };

        /**
         * Creates a plain object from an EchoReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof twirper.EchoReq
         * @static
         * @param {twirper.EchoReq} message EchoReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EchoReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.Message = "";
            if (message.Message != null && message.hasOwnProperty("Message"))
                object.Message = message.Message;
            return object;
        };

        /**
         * Converts this EchoReq to JSON.
         * @function toJSON
         * @memberof twirper.EchoReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EchoReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return EchoReq;
    })();

    twirper.RepeatReq = (function() {

        /**
         * Properties of a RepeatReq.
         * @memberof twirper
         * @interface IRepeatReq
         * @property {string|null} [Message] RepeatReq Message
         * @property {number|null} [NumRepeats] RepeatReq NumRepeats
         * @property {number|Long|null} [DelayMs] RepeatReq DelayMs
         * @property {number|null} [ErrAfter] RepeatReq ErrAfter
         */

        /**
         * Constructs a new RepeatReq.
         * @memberof twirper
         * @classdesc Represents a RepeatReq.
         * @implements IRepeatReq
         * @constructor
         * @param {twirper.IRepeatReq=} [properties] Properties to set
         */
        function RepeatReq(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RepeatReq Message.
         * @member {string} Message
         * @memberof twirper.RepeatReq
         * @instance
         */
        RepeatReq.prototype.Message = "";

        /**
         * RepeatReq NumRepeats.
         * @member {number} NumRepeats
         * @memberof twirper.RepeatReq
         * @instance
         */
        RepeatReq.prototype.NumRepeats = 0;

        /**
         * RepeatReq DelayMs.
         * @member {number|Long} DelayMs
         * @memberof twirper.RepeatReq
         * @instance
         */
        RepeatReq.prototype.DelayMs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * RepeatReq ErrAfter.
         * @member {number} ErrAfter
         * @memberof twirper.RepeatReq
         * @instance
         */
        RepeatReq.prototype.ErrAfter = 0;

        /**
         * Creates a new RepeatReq instance using the specified properties.
         * @function create
         * @memberof twirper.RepeatReq
         * @static
         * @param {twirper.IRepeatReq=} [properties] Properties to set
         * @returns {twirper.RepeatReq} RepeatReq instance
         */
        RepeatReq.create = function create(properties) {
            return new RepeatReq(properties);
        };

        /**
         * Encodes the specified RepeatReq message. Does not implicitly {@link twirper.RepeatReq.verify|verify} messages.
         * @function encode
         * @memberof twirper.RepeatReq
         * @static
         * @param {twirper.IRepeatReq} message RepeatReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RepeatReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Message != null && message.hasOwnProperty("Message"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.Message);
            if (message.NumRepeats != null && message.hasOwnProperty("NumRepeats"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.NumRepeats);
            if (message.DelayMs != null && message.hasOwnProperty("DelayMs"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.DelayMs);
            if (message.ErrAfter != null && message.hasOwnProperty("ErrAfter"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.ErrAfter);
            return writer;
        };

        /**
         * Encodes the specified RepeatReq message, length delimited. Does not implicitly {@link twirper.RepeatReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof twirper.RepeatReq
         * @static
         * @param {twirper.IRepeatReq} message RepeatReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RepeatReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RepeatReq message from the specified reader or buffer.
         * @function decode
         * @memberof twirper.RepeatReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {twirper.RepeatReq} RepeatReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RepeatReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.twirper.RepeatReq();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Message = reader.string();
                    break;
                case 2:
                    message.NumRepeats = reader.int32();
                    break;
                case 3:
                    message.DelayMs = reader.int64();
                    break;
                case 4:
                    message.ErrAfter = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RepeatReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof twirper.RepeatReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {twirper.RepeatReq} RepeatReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RepeatReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RepeatReq message.
         * @function verify
         * @memberof twirper.RepeatReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RepeatReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Message != null && message.hasOwnProperty("Message"))
                if (!$util.isString(message.Message))
                    return "Message: string expected";
            if (message.NumRepeats != null && message.hasOwnProperty("NumRepeats"))
                if (!$util.isInteger(message.NumRepeats))
                    return "NumRepeats: integer expected";
            if (message.DelayMs != null && message.hasOwnProperty("DelayMs"))
                if (!$util.isInteger(message.DelayMs) && !(message.DelayMs && $util.isInteger(message.DelayMs.low) && $util.isInteger(message.DelayMs.high)))
                    return "DelayMs: integer|Long expected";
            if (message.ErrAfter != null && message.hasOwnProperty("ErrAfter"))
                if (!$util.isInteger(message.ErrAfter))
                    return "ErrAfter: integer expected";
            return null;
        };

        /**
         * Creates a RepeatReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof twirper.RepeatReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {twirper.RepeatReq} RepeatReq
         */
        RepeatReq.fromObject = function fromObject(object) {
            if (object instanceof $root.twirper.RepeatReq)
                return object;
            let message = new $root.twirper.RepeatReq();
            if (object.Message != null)
                message.Message = String(object.Message);
            if (object.NumRepeats != null)
                message.NumRepeats = object.NumRepeats | 0;
            if (object.DelayMs != null)
                if ($util.Long)
                    (message.DelayMs = $util.Long.fromValue(object.DelayMs)).unsigned = false;
                else if (typeof object.DelayMs === "string")
                    message.DelayMs = parseInt(object.DelayMs, 10);
                else if (typeof object.DelayMs === "number")
                    message.DelayMs = object.DelayMs;
                else if (typeof object.DelayMs === "object")
                    message.DelayMs = new $util.LongBits(object.DelayMs.low >>> 0, object.DelayMs.high >>> 0).toNumber();
            if (object.ErrAfter != null)
                message.ErrAfter = object.ErrAfter | 0;
            return message;
        };

        /**
         * Creates a plain object from a RepeatReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof twirper.RepeatReq
         * @static
         * @param {twirper.RepeatReq} message RepeatReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RepeatReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.Message = "";
                object.NumRepeats = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.DelayMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.DelayMs = options.longs === String ? "0" : 0;
                object.ErrAfter = 0;
            }
            if (message.Message != null && message.hasOwnProperty("Message"))
                object.Message = message.Message;
            if (message.NumRepeats != null && message.hasOwnProperty("NumRepeats"))
                object.NumRepeats = message.NumRepeats;
            if (message.DelayMs != null && message.hasOwnProperty("DelayMs"))
                if (typeof message.DelayMs === "number")
                    object.DelayMs = options.longs === String ? String(message.DelayMs) : message.DelayMs;
                else
                    object.DelayMs = options.longs === String ? $util.Long.prototype.toString.call(message.DelayMs) : options.longs === Number ? new $util.LongBits(message.DelayMs.low >>> 0, message.DelayMs.high >>> 0).toNumber() : message.DelayMs;
            if (message.ErrAfter != null && message.hasOwnProperty("ErrAfter"))
                object.ErrAfter = message.ErrAfter;
            return object;
        };

        /**
         * Converts this RepeatReq to JSON.
         * @function toJSON
         * @memberof twirper.RepeatReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RepeatReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RepeatReq;
    })();

    twirper.RepeatResp = (function() {

        /**
         * Properties of a RepeatResp.
         * @memberof twirper
         * @interface IRepeatResp
         * @property {number|null} [ID] RepeatResp ID
         * @property {string|null} [Message] RepeatResp Message
         * @property {number|Long|null} [DelayedMs] RepeatResp DelayedMs
         */

        /**
         * Constructs a new RepeatResp.
         * @memberof twirper
         * @classdesc Represents a RepeatResp.
         * @implements IRepeatResp
         * @constructor
         * @param {twirper.IRepeatResp=} [properties] Properties to set
         */
        function RepeatResp(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RepeatResp ID.
         * @member {number} ID
         * @memberof twirper.RepeatResp
         * @instance
         */
        RepeatResp.prototype.ID = 0;

        /**
         * RepeatResp Message.
         * @member {string} Message
         * @memberof twirper.RepeatResp
         * @instance
         */
        RepeatResp.prototype.Message = "";

        /**
         * RepeatResp DelayedMs.
         * @member {number|Long} DelayedMs
         * @memberof twirper.RepeatResp
         * @instance
         */
        RepeatResp.prototype.DelayedMs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new RepeatResp instance using the specified properties.
         * @function create
         * @memberof twirper.RepeatResp
         * @static
         * @param {twirper.IRepeatResp=} [properties] Properties to set
         * @returns {twirper.RepeatResp} RepeatResp instance
         */
        RepeatResp.create = function create(properties) {
            return new RepeatResp(properties);
        };

        /**
         * Encodes the specified RepeatResp message. Does not implicitly {@link twirper.RepeatResp.verify|verify} messages.
         * @function encode
         * @memberof twirper.RepeatResp
         * @static
         * @param {twirper.IRepeatResp} message RepeatResp message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RepeatResp.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Message != null && message.hasOwnProperty("Message"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.Message);
            if (message.DelayedMs != null && message.hasOwnProperty("DelayedMs"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.DelayedMs);
            if (message.ID != null && message.hasOwnProperty("ID"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.ID);
            return writer;
        };

        /**
         * Encodes the specified RepeatResp message, length delimited. Does not implicitly {@link twirper.RepeatResp.verify|verify} messages.
         * @function encodeDelimited
         * @memberof twirper.RepeatResp
         * @static
         * @param {twirper.IRepeatResp} message RepeatResp message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RepeatResp.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RepeatResp message from the specified reader or buffer.
         * @function decode
         * @memberof twirper.RepeatResp
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {twirper.RepeatResp} RepeatResp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RepeatResp.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.twirper.RepeatResp();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 3:
                    message.ID = reader.int32();
                    break;
                case 1:
                    message.Message = reader.string();
                    break;
                case 2:
                    message.DelayedMs = reader.int64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RepeatResp message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof twirper.RepeatResp
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {twirper.RepeatResp} RepeatResp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RepeatResp.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RepeatResp message.
         * @function verify
         * @memberof twirper.RepeatResp
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RepeatResp.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ID != null && message.hasOwnProperty("ID"))
                if (!$util.isInteger(message.ID))
                    return "ID: integer expected";
            if (message.Message != null && message.hasOwnProperty("Message"))
                if (!$util.isString(message.Message))
                    return "Message: string expected";
            if (message.DelayedMs != null && message.hasOwnProperty("DelayedMs"))
                if (!$util.isInteger(message.DelayedMs) && !(message.DelayedMs && $util.isInteger(message.DelayedMs.low) && $util.isInteger(message.DelayedMs.high)))
                    return "DelayedMs: integer|Long expected";
            return null;
        };

        /**
         * Creates a RepeatResp message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof twirper.RepeatResp
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {twirper.RepeatResp} RepeatResp
         */
        RepeatResp.fromObject = function fromObject(object) {
            if (object instanceof $root.twirper.RepeatResp)
                return object;
            let message = new $root.twirper.RepeatResp();
            if (object.ID != null)
                message.ID = object.ID | 0;
            if (object.Message != null)
                message.Message = String(object.Message);
            if (object.DelayedMs != null)
                if ($util.Long)
                    (message.DelayedMs = $util.Long.fromValue(object.DelayedMs)).unsigned = false;
                else if (typeof object.DelayedMs === "string")
                    message.DelayedMs = parseInt(object.DelayedMs, 10);
                else if (typeof object.DelayedMs === "number")
                    message.DelayedMs = object.DelayedMs;
                else if (typeof object.DelayedMs === "object")
                    message.DelayedMs = new $util.LongBits(object.DelayedMs.low >>> 0, object.DelayedMs.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a RepeatResp message. Also converts values to other types if specified.
         * @function toObject
         * @memberof twirper.RepeatResp
         * @static
         * @param {twirper.RepeatResp} message RepeatResp
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RepeatResp.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.Message = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.DelayedMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.DelayedMs = options.longs === String ? "0" : 0;
                object.ID = 0;
            }
            if (message.Message != null && message.hasOwnProperty("Message"))
                object.Message = message.Message;
            if (message.DelayedMs != null && message.hasOwnProperty("DelayedMs"))
                if (typeof message.DelayedMs === "number")
                    object.DelayedMs = options.longs === String ? String(message.DelayedMs) : message.DelayedMs;
                else
                    object.DelayedMs = options.longs === String ? $util.Long.prototype.toString.call(message.DelayedMs) : options.longs === Number ? new $util.LongBits(message.DelayedMs.low >>> 0, message.DelayedMs.high >>> 0).toNumber() : message.DelayedMs;
            if (message.ID != null && message.hasOwnProperty("ID"))
                object.ID = message.ID;
            return object;
        };

        /**
         * Converts this RepeatResp to JSON.
         * @function toJSON
         * @memberof twirper.RepeatResp
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RepeatResp.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RepeatResp;
    })();

    return twirper;
})();

export { $root as default };
