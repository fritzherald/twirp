// Copyright 2018 MyGnar, Inc.  All Rights Reserved.
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

package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/gnarbox/twirpjs/example/twirper"
	"github.com/rs/cors" // CORS handling for twirper web client
	"github.com/twitchtv/twirp"
)

// Don't use twirp's InvalidArgument function because the message prints weirdly
func invalidArgumentError(argument, validationMsg string) twirp.Error {
	err := twirp.NewError(twirp.InvalidArgument, validationMsg)
	err = err.WithMeta("argument", argument)
	return err
}

var (
	errMissingMessage = invalidArgumentError(`Message`, `I won't be silent`)
)

type theTwirper struct{}

func (tt *theTwirper) Echo(ctx context.Context, req *twirper.EchoReq) (*twirper.EchoReq, error) {
	fmt.Println()
	log.Printf("(theTwirper#Echo) Echo called with %#v", req)
	if req.Message == `` {
		log.Printf("(theTwirper#Echo) Returning %#v", errMissingMessage)
		return nil, errMissingMessage
	}
	log.Printf("(theTwirper#Echo) Returning %#v", req)
	return req, nil
}

func (tt *theTwirper) Repeat(ctx context.Context, req *twirper.RepeatReq) (<-chan twirper.RepeatRespOrError, error) {
	fmt.Println()
	log.Printf("(theTwirper#Repeat) Repeat called with %#v", req)
	if req.Message == `` {
		return nil, errMissingMessage
	}
	if req.NumRepeats <= 0 {
		return nil, errMissingMessage
	}
	respStream := make(chan twirper.RepeatRespOrError)
	go sendRepeatResps(ctx, req, respStream)
	return respStream, nil
}

func main() {
	server := twirper.NewTwirperServer(&theTwirper{}, nil)
	// Wrap the server with a liberal (unsafe?) cors policy so the react example works
	handler := cors.Default().Handler(server)
	log.Println(`Listening on port 8888`)
	log.Fatal(http.ListenAndServe(`:8888`, handler))
}
