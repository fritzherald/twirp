RETOOL=$(CURDIR)/_tools/bin/retool -base-dir `pwd`
PATH := ${PWD}/bin:${PWD}/_tools/bin:${PATH}
.DEFAULT_GOAL := all

all: setup generate
	# Now you can run the server with "make run-server"
	# And you can run the server with "make run-go-client"

setup:
	./install_proto.bash
	# Install retool, dep, protoc-gen-go, protoc-gen-twirp, and vendored go dependencies
	GOPATH=$(CURDIR)/_tools go install "github.com/twitchtv/retool/..."
	$(RETOOL) build
	$(RETOOL) do dep ensure -v

generate:
	$(RETOOL) do protoc --go_out=twirper --twirp_out=twirper twirper.proto
	@$(MAKE) -C twirper_react_client all

run-server:
	GOBIN=$(CURDIR)/bin go install -v ./twirper_go_server
	./bin/twirper_go_server

run-go-client:
	GOBIN=$(CURDIR)/bin go install -v ./twirper_go_client
	$(eval client=./bin/twirper_go_client)
	@echo "\n### Running client with default options"
	$(client)
	@echo "\n### Running again, but have the server return an error after the fifth message"
	$(client) -err=5 || true
	@echo "\n### Cancel the request context after the fifth message"
	$(client) -cancel=5 || true
