"use strict";
/* Copyright © 2021-2022 Richard Rodger, MIT License. */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_1 = __importDefault(require("cookie"));
const gubu_1 = require("gubu");
function gateway_lambda(options) {
    const seneca = this;
    const tag = seneca.plugin.tag;
    const gtag = (null == tag || '-' === tag) ? '' : '$' + tag;
    const gateway = seneca.export('gateway' + gtag + '/handler');
    const parseJSON = seneca.export('gateway' + gtag + '/parseJSON');
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
    async function handler(event, context) {
        var _a, _b;
        const res = {
            statusCode: 200,
            headers: { ...options.headers },
            body: '{}',
        };
        let body = event.body;
        let json = null == body ? {} :
            'string' === typeof (body) ? parseJSON(body) : body;
        json = null == json ? {} : json;
        if (json.error$) {
            res.statusCode = 400;
            res.body = JSON.stringify(json);
            return res;
        }
        // Check if hook
        if ('GET' === event.httpMethod) {
            let pm = event.path.match(/([^\/]+)\/([^\/]+)$/);
            console.log('HOOK', event.path, pm);
            if (pm) {
                json.name = pm[1];
                json.code = pm[2];
                json.handle = 'hook';
            }
            console.log('HOOK MSG', json);
        }
        let result = await gateway(json, { res, event, context });
        if (result.out) {
            res.body = JSON.stringify(result.out);
        }
        let gateway$ = result.gateway$;
        if (gateway$) {
            delete result.gateway$;
            if (gateway$.auth && options.auth) {
                if (gateway$.auth.token) {
                    let cookieStr = cookie_1.default.serialize(options.auth.token.name, gateway$.auth.token, {
                        ...options.auth.cookie,
                        ...(gateway$.auth.cookie || {})
                    });
                    console.log('SET-COOKIE', cookieStr, options.auth.cookie, gateway$.auth.cookie);
                    res.headers['set-cookie'] = cookieStr;
                }
                else if (gateway$.auth.remove) {
                    res.headers['set-cookie'] =
                        options.auth.token.name + '=NONE; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                }
            }
            else if ((_a = gateway$.redirect) === null || _a === void 0 ? void 0 : _a.location) {
                res.statusCode = 302;
                res.headers.location = (_b = gateway$.redirect) === null || _b === void 0 ? void 0 : _b.location;
            }
            if (result.error) {
                res.statusCode = gateway$.status || 500;
            }
            else if (gateway$.status) {
                res.statusCode = gateway$.status;
            }
        }
        return res;
    }
    return {
        name: 'gateway-lambda',
        exports: {
            handler,
        }
    };
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
        cookie: (0, gubu_1.Open)({
            maxAge: 365 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: true,
            path: '/',
        })
    },
    headers: (0, gubu_1.Open)({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Credentials': 'true',
    })
};
exports.default = gateway_lambda;
if ('undefined' !== typeof (module)) {
    module.exports = gateway_lambda;
}
//# sourceMappingURL=gateway-lambda.js.map