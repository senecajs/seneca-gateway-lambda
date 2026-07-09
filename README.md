![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/gateway-lambda

[![npm version](https://img.shields.io/npm/v/@seneca/gateway-lambda.svg)](https://npmjs.com/package/@seneca/gateway-lambda)
[![build](https://github.com/senecajs/seneca-gateway-lambda/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-gateway-lambda/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-gateway-lambda/badge.svg)](https://snyk.io/test/github/senecajs/seneca-gateway-lambda)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install @seneca/gateway-lambda
```

## Quick Example

```js
const Seneca = require('seneca')
const GatewayLambda = require('@seneca/gateway-lambda')

Seneca().use(GatewayLambda)
```

## More Examples

See [test/](test/) for more usage examples.

## Motivation

AWS Lambda gateway plugin for Seneca microservices.

## Support

If you're using this module and need help, you can:

- Post a [github issue](https://github.com/senecajs/seneca-gateway-lambda/issues)
- Tweet to [@senecajs](http://twitter.com/senecajs)
- Ask on the [Gitter](https://gitter.im/senecajs/seneca)

## API

See [source](https://github.com/senecajs/seneca-gateway-lambda) for API details.

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

### Running tests

```sh
npm run test
```

## Background

Part of the [seneca-gateway](https://github.com/senecajs/seneca-gateway) family. Uses [AWS Lambda](https://aws.amazon.com/lambda/).
