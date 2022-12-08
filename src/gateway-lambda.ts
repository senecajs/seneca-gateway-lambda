/* Copyright © 2021-2022 Richard Rodger, MIT License. */


import Cookie from 'cookie'


import { Open, Skip } from 'gubu'


import type {
  GatewayResult
} from '@seneca/gateway'


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

    let queryStringParams = { ...(event.queryStringParameters||{}), ...(event.multiValueQueryStringParameters||{}) }
    Object.keys(queryStringParams).forEach((key, index)=>{
      queryStringParams[key] = (Array.isArray(queryStringParams[key]) && queryStringParams[key].length === 1)?queryStringParams[key][0]:queryStringParams[key]
    })

    json.gateway = {
      params: event.pathParameters,
      query: queryStringParams,
    }

    console.log(json)

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


  async function eventhandler(event: any, context: any) {
    let msg = seneca.util.Jsonic(event.seneca$.msg)
    // console.log('MSG', msg)

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
  })
}


export default gateway_lambda

if ('undefined' !== typeof (module)) {
  module.exports = gateway_lambda
}
