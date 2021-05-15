package com.gnarbox.twirp;

import com.google.protobuf.CodedInputStream;
import com.google.protobuf.Message;

import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

import io.reactivex.Flowable;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public final class GBXTwirp {
	private static OkHttpClient client;

	// Constants
	private static final String TAG = "GBXTwirp";
	private static final MediaType PROTOBUF = MediaType.parse("application/protobuf");
	private static final long MESSAGE_TAG = (1 << 3) | 2;
	private static final long TRAILER_TAG = (2 << 3) | 2;

	// Constructor
	public GBXTwirp() {}

	public static Flowable<byte[]> twirp(final String url, final Message reqMsg, final boolean streamingResp) {
		final class TwirpState {
			Response resp;
			CodedInputStream respStream;
		}
		return Flowable.generate(
			() -> { // initializer (state generator)
				// TODO: validate params, throw error if validation fails

				if (client == null) {
					// instantiate client with maximum available timeout values
					// to prevent java.net.SocketTimeoutException
					OkHttpClient.Builder builder = new OkHttpClient.Builder();
					builder.connectTimeout(0, TimeUnit.MILLISECONDS)
						.writeTimeout(0, TimeUnit.MILLISECONDS)
						.readTimeout(0, TimeUnit.MILLISECONDS);
					client = builder.build();
				}

				final RequestBody body = RequestBody.create(PROTOBUF, reqMsg.toByteArray());
				final Request req = new Request.Builder().url(url).post(body).build();
				final Response resp;
				try {
					resp = client.newCall(req).execute();
				} catch (IOException err) {
					throw new GBXTwirpError("Request failed", err);
				}
				// Log.v(TAG, "(twirp) Response! "
				// 	+ "status=" + resp.code() + " "
				// 	+ "type=" + resp.body().contentType().toString() + " "
				// 	+ "len=" + resp.body().contentLength()
				// );
				if (!resp.isSuccessful()) {
					GBXTwirpError twerr = GBXTwirpError.fromJSON(resp.body().string());
					resp.close();
					// Log.e(TAG, "(twirp) Received error response! "
					// 	+ "status=" + resp.code() + " "
					// 	+ "type=" + resp.body().contentType().toString() + " "
					// 	+ "len=" + resp.body().contentLength() + " "
					// 	+ "err=" + twerr.toString()
					// );
					throw twerr;
				}
				InputStream respByteStream = resp.body().byteStream();
				CodedInputStream codedRespStream = CodedInputStream.newInstance(respByteStream);
				TwirpState state = new TwirpState();
				state.resp = resp;
				state.respStream = codedRespStream;
				return state;
			},
			(state, output) -> {
				if (!streamingResp) {
					output.onNext(state.resp.body().bytes());
					state.resp.close();
					output.onComplete();
					return;
				}
				int fieldTag = state.respStream.readTag();
				if (fieldTag == TRAILER_TAG) {
					String errStr = state.respStream.readString();
					if (errStr.equals("EOF")) {
						output.onComplete();
						return;
					}
					output.onError(GBXTwirpError.fromJSON(errStr));
					return;
				}
				if (fieldTag != MESSAGE_TAG) {
					output.onError(new GBXTwirpError("internal", "Invalid field tag!"));
					return;
				}
				int msgLen = (int) state.respStream.readRawVarint64();
				try {
					byte[] msgBytes = state.respStream.readRawBytes(msgLen);
					output.onNext(msgBytes);
				} catch (IOException err) {
					output.onError(new GBXTwirpError("Failed to read twirp response", err));
				}
			},
			state -> {
				state.resp.close();
			}
		);
	}

	private static String printBytes(byte[] bytes) {
		String str = "";
		for (int j = 0; j < bytes.length; j++) {
			int v = bytes[j] & 0xFF;
			str = str.concat("" + v + " ");
		}
		if (str.length() == 0) { return str; }
		return str.substring(0, str.length() - 1);
	}
}
