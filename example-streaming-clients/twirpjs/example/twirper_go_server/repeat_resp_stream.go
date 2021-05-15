// Original work Copyright 2018 Twitch Interactive, Inc.  All Rights Reserved.
// Modified work Copyright 2018 MyGnar, Inc.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"). You may not
// use this file except in compliance with the License. A copy of the License is
// located at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// or in the "license" file accompanying this file. This file is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied. See the License for the specific language governing
// permissions and limitations under the License.

// Adapted from https://github.com/twitchtv/twirp/tree/master/example
//          and https://github.com/twitchtv/twirp/issues/70

package main

import (
	"context"
	"io"
	"log"
	"time"

	"github.com/gnarbox/twirpjs/example/twirper"
	"github.com/twitchtv/twirp"
)

func sendRepeatResps(ctx context.Context, req *twirper.RepeatReq, respStream chan twirper.RepeatRespOrError) {
	defer close(respStream)
	repeated := int32(0)
	lastTime := time.Now()
	for {
		if req.ErrAfter != 0 && repeated == req.ErrAfter {
			err := twirp.NewError(twirp.Unknown, `you wanted this error`)
			err = err.WithMeta(`extra_info`, `goes in meta`)
			log.Printf("(sendRepeatResps) Client requested an error, returning error %#v", err)
			respStream <- twirper.RepeatRespOrError{Err: err}
			return
		}
		if repeated == req.NumRepeats {
			log.Printf("(sendRepeatResps) Closing stream")
			return
		}
		repeated++

		var delay <-chan time.Time
		if req.DelayMs == 0 {
			dd := make(chan time.Time)
			close(dd)
			delay = dd
		} else {
			delay = time.After(time.Duration(req.DelayMs) * time.Millisecond)
		}

		select {
		case <-ctx.Done():
			err := errAborted(ctx.Err())
			log.Printf(
				`(sendRepeatResps) Context canceled, returning error "%+v"`+
					" (Note: this error goes nowhere because the connection is closed)\n",
				err,
			)
			respStream <- twirper.RepeatRespOrError{Err: err}

		case <-delay:
			resp := &twirper.RepeatResp{
				Message:   req.Message,
				DelayedMs: time.Since(lastTime).Nanoseconds() / 1000000,
				ID:        repeated,
			}
			lastTime = time.Now()
			log.Printf("(sendRepeatResps) Sending %#v", *resp)
			respStream <- twirper.RepeatRespOrError{Msg: resp}
		}
	}
}

type repeatRespStream struct {
	req      *twirper.RepeatReq
	lastTime time.Time
	repeated int32
}

func newRepeatRespStream(req *twirper.RepeatReq) *repeatRespStream {
	return &repeatRespStream{req, time.Now(), 0}
}

func (rs *repeatRespStream) Next(ctx context.Context) (*twirper.RepeatResp, error) {
	if rs.req.ErrAfter != 0 && rs.repeated == rs.req.ErrAfter {
		err := twirp.NewError(twirp.Unknown, `you wanted this error`)
		err = err.WithMeta(`extra_info`, `goes in meta`)
		log.Printf("(sendRepeatResps) Client requested an error, returning error %#v", err)
		return nil, err
	}
	if rs.repeated == rs.req.NumRepeats {
		log.Printf("(sendRepeatResps) Returning %#v", io.EOF)
		return nil, io.EOF
	}
	rs.repeated++

	var delay <-chan time.Time
	if rs.req.DelayMs == 0 {
		dd := make(chan time.Time)
		close(dd)
		delay = dd
	} else {
		delay = time.After(time.Duration(rs.req.DelayMs) * time.Millisecond)
	}

	select {
	case <-ctx.Done():
		err := errAborted(ctx.Err())
		log.Printf(
			`(sendRepeatResps) Context canceled, returning error "%+v"`+
				" (Note: this error goes nowhere because the connection is closed)\n",
			err,
		)
		return nil, err
		// // Things get really weird if you don't return an error...
		// return &twirper.RepeatResp{Message: err.Error()}, nil

	case <-delay:
		resp := &twirper.RepeatResp{
			Message:   rs.req.Message,
			DelayedMs: time.Since(rs.lastTime).Nanoseconds() / 1000000,
			ID:        rs.repeated,
		}
		rs.lastTime = time.Now()
		log.Printf("(sendRepeatResps) Returning %#v", *resp)
		return resp, nil
	}
}

// For a sender, End will be called by generated code when we're going to stop
// sending messages for any reason: either we have received nil, io.EOF from a
// call to Next, or we have to shut down for some other reason (like the
// receiver went away).
// [from https://github.com/twitchtv/twirp/issues/70#issuecomment-361454005]
func (rs *repeatRespStream) End(err error) {
	log.Printf("(repeatRespStream#End) Stream ended with %#v\n", err)
}

func errAborted(err error) error {
	if err == nil {
		return twirp.NewError(twirp.Aborted, `canceled`).WithMeta(`cause`, `unknown`)
	}
	return twirp.NewError(twirp.Aborted, err.Error())
}
