/* Copyright © 2021 Richard Rodger, MIT License. */

function gateway_lambda(this: any, options: any) {
  const seneca: any = this
  const gateway = seneca.export('gateway/handler')
  const parseJSON = seneca.export('gateway/parseJSON')


  async function handler(event: any, context: any) {

    const res: any = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // TODO: option!
      },
      body: '{}',
    }

    let body = event.body
    let json = 'string' === typeof (body) ? parseJSON(body) : body
    if (json.error$) {
      res.statusCode = 400
      res.body = JSON.stringify(json)
    }
    else {
      let out: any = await gateway(json, { res, event, context })
      if (null != out) {
        res.body = JSON.stringify(out)
        if (out.error$) {
          res.statusCode = 400
        }
      }
    }

    return res
  }


  return {
    name: 'gateway-lambda',
    exports: {
      handler
    }
  }
}


// Default options.
gateway_lambda.defaults = {
}


export default gateway_lambda

if ('undefined' !== typeof (module)) {
  module.exports = gateway_lambda
}
