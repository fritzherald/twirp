
all: install generate

generate: twirper.twirp

install:
	yarn

%.twirp:
	$(eval basename=$(@:.twirp=))
	$(eval proto_file=../$(basename).proto)
	$(eval out_dir=./src)
	$(eval twirp_file=$(out_dir)/$(basename).twirp.js)
	$(eval pbjs_file=$(out_dir)/$(basename).pb.js)
	@# twirpjs relies on a new "keep-case-all" flag that has yet to be merged upstream
	npx pbjs --target static-module --es6 --keep-case-all $(proto_file) -o $(pbjs_file)
	npx gen_twirpjs $(proto_file) > $(twirp_file)
