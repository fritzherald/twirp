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
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gnarbox/twirpjs/example/twirper"
)

var (
	echoReq = &twirper.EchoReq{
		Message: `Is any server out there?`,
	}
	repeatReq = &twirper.RepeatReq{
		Message:    `Is any server listening?`,
		NumRepeats: 10,
		DelayMs:    100,
		ErrAfter:   0,
	}
)

func main() {
	port := flag.Int(`p`, 8888, `the port on which the server is listening`)
	host := flag.String(`h`, `http://localhost`, `where to look for the server`)
	cancelAfter := flag.Int(`cancel`, -1, `after this many messages, cancel the streaming request's context (no cancel if c < 0)`)
	repetitions := flag.Int(`n`, int(repeatReq.NumRepeats), `number of streaming messages to request from the server`)
	delayMs := flag.Int(`d`, int(repeatReq.DelayMs), `milliseconds delay between streamed response messages`)
	errAfter := flag.Int(`err`, int(repeatReq.ErrAfter), `tell the server to return an error after this many streaming messages`)
	flag.Parse()
	repeatReq.NumRepeats = int32(*repetitions)
	repeatReq.DelayMs = int64(*delayMs)
	repeatReq.ErrAfter = int32(*errAfter)

	fmt.Printf("Twirping the twirper server at %s:%d...\n", *host, *port)

	client := twirper.NewTwirperProtobufClient(
		fmt.Sprintf(`%s:%d`, *host, *port),
		http.DefaultClient,
	)

	echoResp, err := client.Echo(context.Background(), echoReq)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("\tResponse from Echo(%+v):\n\t\t%+v\n", echoReq, echoResp)

	// Ask for a stream of hats
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // cancel is idempotent but must be called, so call it on exit no matter what
	repeatRespStream, err := client.Repeat(ctx, repeatReq)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("\tResponse from Repeat(%+v):\n", repeatReq)
	var lastID int32 = 0
	for respOrErr := range repeatRespStream {
		// repeatResp, err := repeatRespStream.Next(context.Background())
		if respOrErr.Err != nil {
			fmt.Printf("\t\t<ERROR:> %+v\n", respOrErr.Err)
			os.Exit(1)
		}
		repeatResp := respOrErr.Msg
		lastID = repeatResp.ID
		fmt.Printf("\t\t%+v\n", repeatResp)
		if lastID == int32(*cancelAfter) {
			fmt.Println("\t\t<Cancelling request context>")
			cancel()
		}
	}
	fmt.Printf("\tGoodbye\n")
}
