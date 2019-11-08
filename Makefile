all: lint test

test: lint
	npm run test

lint:
	npm run lint