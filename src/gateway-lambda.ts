/* Copyright © 2021-2022 Richard Rodger, MIT License. */


import Cookie from 'cookie'

import { Open } from 'gubu'


import type {
  GatewayResult
} from '@seneca/gateway'


type GatewayLambdaOptions = {
  auth?: {
    cognito: {
      required: boolean
    },
    token: {
      // Cookie name
      name: string
    }
    // Default cookie fields
    cookie?: any
  },
  // error?: {

  //   // Use the default express error handler for errors
  //   next: boolean
  // },

  headers: Record<string, string>
}


type GatewayLambdaDirective = {
  // Call Lambda response.next (passes error if defined)
  // next?: boolean

  // Set/remove login cookie
  auth?: {

    // Cookie token value
    token: string

    // Override option cookie fields
    cookie?: any

    // Remove auth cookie
    remove?: boolean
  }

  // HTTP redirect
  redirect?: {
    location: string
  }

  // HTTP status code
  status?: number
}



function gateway_lambda(this: any, options: GatewayLambdaOptions) {
  const seneca: any = this

  const tag = seneca.plugin.tag
  const gtag = (null == tag || '-' === tag) ? '' : '$' + tag
  const gateway = seneca.export('gateway' + gtag + '/handler')
  const parseJSON = seneca.export('gateway' + gtag + '/parseJSON')


  /* TODO: move to gateway-auth
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
  */


  async function handler(event: any, context: any) {

    const res: any = {
      statusCode: 200,
      headers: { ...options.headers },
      // headers: {
      //   'Access-Control-Allow-Origin': options.headers['Access-Control-Allow-Origin'],
      //   'Access-Control-Allow-Headers': options.headers['Access-Control-Allow-Headers'],
      // },
      body: '{}',
    }

    let body = event.body

    let json = 'string' === typeof (body) ? parseJSON(body) : body

    if (json.error$) {
      res.statusCode = 400
      res.body = JSON.stringify(json)
      return res
    }

    let result: any = await gateway(json, { res, event, context })

    if (result.out) {
      res.body = JSON.stringify(result.out)
    }

    let gateway$: GatewayLambdaDirective = result.gateway$

    if (gateway$.auth && options.auth) {
      if (gateway$.auth.token) {
        res.headers['set-cookie'] =
          Cookie.serialize(
            options.auth.token.name,
            gateway$.auth.token,
            {
              ...options.auth.cookie,
              ...(gateway.auth.cookie || {})
            }
          )
      }
      else if (gateway$.auth.remove) {
        res.headers['set-cookie'] =
          options.auth.token + '=NONE; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    }

    else if (gateway$.redirect?.location) {
      res.statusCode = 302
      res.headers.loction = gateway$.redirect?.location
    }

    if (result.error) {
      res.statusCode = gateway$.status || 500
    }
    else if (gateway$.status) {
      res.statusCode = gateway$.status
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
    },
    token: {
      name: 'seneca-auth'
    },
    cookie: Open({
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: true,
    })
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
