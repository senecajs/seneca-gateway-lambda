/* Copyright © 2021-2022 Richard Rodger, MIT License. */


import Cookie from 'cookie'


import { Open, Skip } from 'gubu'


import type {
  GatewayResult
} from '@seneca/gateway'


type WebHookSpec = {
  re: RegExp
  params: string[]
  fixed: Record<string, any>
}

type GatewayLambdaOptions = {
  event?: {
    msg?: any
  },
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
  headers: Record<string, string>,
  webhooks?: WebHookSpec[]
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

  // Custom headers
  headers?: Record<string, string>
}



function gateway_lambda(this: any, options: GatewayLambdaOptions) {
  const seneca: any = this

  const tag = seneca.plugin.tag
  const gtag = (null == tag || '-' === tag) ? '' : '$' + tag
  const gateway = seneca.export('gateway' + gtag + '/handler')
  const parseJSON = seneca.export('gateway' + gtag + '/parseJSON')

  const webhookMatch = (event: any, json: any) => {
    let match = false
    done: for (let webhook of (options.webhooks || [])) {
      if (webhook.re) {
        let m = webhook.re.exec(event.path)
        if (m) {
          let params = (webhook.params || [])
          for (let pI = 0; pI < params.length; pI++) {
            let param = params[pI]
            json[param] = m[1 + pI]
          }
          Object.assign(json, (webhook.fixed || {}))
          match = true
          break done;
        }
      }
    }
    return match
  }


  async function handler(event: any, context: any) {

    const res: any = {
      statusCode: 200,
      headers: { ...options.headers },
      body: '{}',
    }

    let body = event.body
    let headers = null == event.headers ? {} : Object
      .entries(event.headers)
      .reduce(
        (a: any, entry: any) => (a[entry[0].toLowerCase()] = entry[1], a),
        ({} as any)
      )

    let json = null == body ? {} :
      'string' === typeof (body) ? parseJSON(body) : body

    json = null == json ? {} : json

    if (json.error$) {
      res.statusCode = 400
      res.body = JSON.stringify(json)
      return res
    }


    // Check if hook
    if (
      // TODO: legacy, deprecate
      'GET' === event.httpMethod
    ) {
      let pm = event.path.match(/([^\/]+)\/([^\/]+)$/)
      if (pm) {
        json.name = pm[1]
        json.code = pm[2]
        json.handle = 'hook'
      }
    }
    else {
      webhookMatch(event, json)
    }

    // console.log('AAA', json)

    let queryStringParams = {
      ...(event.queryStringParameters || {}),
      ...(event.multiValueQueryStringParameters || {})
    }

    Object.keys(queryStringParams).forEach((key, _index) => {
      queryStringParams[key] =
        (Array.isArray(queryStringParams[key]) &&
          queryStringParams[key].length === 1) ?
          queryStringParams[key][0] : queryStringParams[key]
    })

    json.gateway = {
      params: event.pathParameters,
      query: queryStringParams,
      body,
      headers
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

      // TODO: should also accept `header` to match express
      if (gateway$.headers) {
        res.headers = { ...res.headers, ...gateway$.headers }
      }
    }

    return res
  }


  async function eventhandler(event: any, context: any) {
    let msg = seneca.util.Jsonic(event.seneca$.msg)

    let json = {
      event,
      ...msg,
    }
    let result: any = await gateway(json, { event, context })
    return result
  }


  return {
    name: 'gateway-lambda',
    exports: {
      handler,
      eventhandler,
    }
  }
}


// Default options.
gateway_lambda.defaults = {
  event: {
    msg: 'sys,gateway,handle:event'
  },
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
  }),
  webhooks: [{
    re: RegExp,
    params: [String],
    fixed: {}
  }]
}


export default gateway_lambda

if ('undefined' !== typeof (module)) {
  module.exports = gateway_lambda
}
