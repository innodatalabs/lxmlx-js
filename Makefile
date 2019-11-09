all: lint test bld

test: lint
	npm run test

lint:
	npm run lint

bld:
	npm run build