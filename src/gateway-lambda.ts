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
      body: '{}',
    }

    let body = event.body

    let json = null == body ? {} :
      'string' === typeof (body) ? parseJSON(body) : body

    json = null == json ? {} : json

    if (json.error$) {
      res.statusCode = 400
      res.body = JSON.stringify(json)
      return res
    }


    // Check if hook
    if ('GET' === event.httpMethod) {
      let pm = event.path.match(/([^\/]+)\/([^\/]+)$/)
      console.log('HOOK', event.path, pm)
      if (pm) {
        json.name = pm[1]
        json.code = pm[2]
        json.handle = 'hook'
      }
      console.log('HOOK MSG', json)
    }

    let result: any = await gateway(json, { res, event, context })

    if (result.out) {
      res.body = JSON.stringify(result.out)
    }

    let gateway$: GatewayLambdaDirective = result.gateway$

    if (gateway$) {
      delete result.gateway$

      if (gateway$.auth && options.auth) {
        if (gateway$.auth.token) {
          let cookieStr =
            Cookie.serialize(
              options.auth.token.name,
              gateway$.auth.token,
              {
                ...options.auth.cookie,
                ...(gateway$.auth.cookie || {})
              }
            )
          console.log('SET-COOKIE', cookieStr, options.auth.cookie, gateway$.auth.cookie)
          res.headers['set-cookie'] = cookieStr
        }
        else if (gateway$.auth.remove) {
          res.headers['set-cookie'] =
            options.auth.token.name + '=NONE; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      }

      else if (gateway$.redirect?.location) {
        res.statusCode = 302
        res.headers.location = gateway$.redirect?.location
      }

      if (result.error) {
        res.statusCode = gateway$.status || 500
      }
      else if (gateway$.status) {
        res.statusCode = gateway$.status
      }
    }

    return res
  }



  return {
    name: 'gateway-lambda',
    exports: {
      handler,
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
      path: '/',
    })
  },
  headers: Open({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': 'true',
  })
}


export default gateway_lambda

if ('undefined' !== typeof (module)) {
  module.exports = gateway_lambda
}
