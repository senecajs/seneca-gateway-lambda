/* Copyright © 2021 Richard Rodger, MIT License. */

function gateway_lambda(this: any, options: any) {
  const seneca: any = this
  const gateway = seneca.export('gateway/handler')
  const parseJSON = seneca.export('gateway/parseJSON')


  seneca.act('sys:gateway,add:hook,hook:custom', {
    action: async function gateway_lambda_custom(custom: any, _json: any, ctx: any) {
      const user = ctx.event?.requestContext?.authorizer?.claims
      if (user) {
        // TODO: need a plugin, seneca-principal, to make this uniform
        custom.principal = { user }
      }
    }
  })


  seneca.act('sys:gateway,add:hook,hook:action', {
    action: function gateway_lambda_before(this: any, _msg: any, ctx: any) {
      if (options.auth.cognito.required) {
        let seneca: any = this
        let user = seneca?.fixedmeta?.custom?.principal?.user
        if (null == user) {
          return { ok: false, why: 'no-auth' }
        }
      }
    }
  })



  async function handler(event: any, context: any) {

    const res: any = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': options.headers['Access-Control-Allow-Origin'],
        'Access-Control-Allow-Headers': options.headers['Access-Control-Allow-Headers'],
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
  auth: {
    cognito: {
      required: false
    }
  },
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
  }
}


export default gateway_lambda

if ('undefined' !== typeof (module)) {
  module.exports = gateway_lambda
}
