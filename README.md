# BES 2022 - Blockchain Auctions API

[![DOI](https://zenodo.org/badge/563454888.svg)](https://zenodo.org/badge/latestdoi/563454888)

Implementation of an API and smart cpontract for distributed auctions for EVM compatible blockchains. Does not inlcude a frontend. Refer to `openapi.yaml` for detailed API documentation.

## Requirements

For local development:

* Node v16 or higher
* [Truffle](https://www.trufflesuite.com/docs/truffle/getting-started/installation): `npm install -g truffle`
* [Ganache](https://github.com/trufflesuite/ganache-cli): `npm install -g ganache-cli`
* [Redis](https://redis.io/) (or use Docker)

To start up the application stack with Docker:

* [Docker](https://www.docker.com/get-started)
* [docker-compose](https://docs.docker.com/compose/install/)

## Start development environemnt

**Before starting the server, copy .env.example as .env and fill in the TODO fields.** The provided values are defaults for Redis, Ganache and the applicattion server.

Install the dependencies and node modules:

    $ npm install

To compile the contracts in `/contracts` run

    $ truffle compile

Afterwards run the server with

    $ npm start

The default port is 9000. This can be configured in the `.env` file.

## Start from docker image

**Before starting from docker, copy .env.example as .env and fill in the TODO fields.**

It's possible to startup the application stack with docker-compose:

    $ docker-compose up -d # Starts the api server, Redis and Ganache

### Cleanup Docker volumes

    $ docker-compose down --volumes