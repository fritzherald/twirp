package com.gnarbox.twirp;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import org.json.JSONException;
import org.json.JSONObject;

public final class GBXTwirpError extends Exception {
	public String msg;
	public String code; // TODO: use enum
	public Map<String, String> meta;

	public static final GBXTwirpError EOF = new GBXTwirpError("EOF", "End of stream");

	public static GBXTwirpError fromJSON(String jsonStr) {
		HashMap<String, String> meta = new HashMap<String, String>();
		String code;
		String msg;
		try {
			JSONObject twerr = new JSONObject(jsonStr);
			code = twerr.get("code").toString();
			msg = twerr.get("msg").toString();
			Object metaObj = twerr.get("meta");
			if (metaObj instanceof JSONObject) {
				JSONObject mm = (JSONObject) metaObj;
				Iterator<String> keys = mm.keys();
				while (keys.hasNext()) {
					String key = keys.next();
					String val = mm.get(key).toString();
					meta.put(key, val);
				}
			}
		} catch (JSONException err) {
			code = "internal";
			msg = "Unable to decode twirp error: " + err.toString();
			meta.put("rawErr", jsonStr);
		}
		return new GBXTwirpError(code, msg, meta);
	}

	public GBXTwirpError(String msg) {
		super(msg);
		this.code = "internal";
		this.msg = msg;
		this.meta = new HashMap<String, String>();
	}

	public GBXTwirpError(String code, String msg) {
		super(msg);
		this.code = code;
		this.msg = msg;
		this.meta = new HashMap<String, String>();
	}

	public GBXTwirpError(String msg, Throwable throwable) {
		super(msg, throwable);
		this.code = "internal";
		this.msg = msg;
		this.meta = new HashMap<String, String>();
		this.meta.put("cause", throwable.getLocalizedMessage());
	}

	public GBXTwirpError(String code, String msg, HashMap<String, String> meta) {
		super(msg);
		this.code = code;
		this.msg = msg;
		this.meta = meta;
	}

	@Override
	public String toString() {
		return GBXTwirpError.toString(this.code, this.msg, this.meta);
	}

	private static String toString(String code, String msg, Map<String, String> meta) {
		String ss = msg + " (" + code + ")";
		if (meta.size() > 0) {
			ss += " " + meta;
		}
		return ss;
	}
}
