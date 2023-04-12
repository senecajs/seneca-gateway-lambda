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
    async function handler(event, context) {
        var _a, _b;
        const res = {
            statusCode: 200,
            headers: { ...options.headers },
            body: '{}',
        };
        let body = event.body;
        let headers = Object
            .entries(event.headers)
            .reduce((a, entry) => (a[entry[0].toLowerCase()] = entry[1], a), {});
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
            if (pm) {
                json.name = pm[1];
                json.code = pm[2];
                json.handle = 'hook';
            }
        }
        let queryStringParams = {
            ...(event.queryStringParameters || {}),
            ...(event.multiValueQueryStringParameters || {})
        };
        Object.keys(queryStringParams).forEach((key, _index) => {
            queryStringParams[key] =
                (Array.isArray(queryStringParams[key]) &&
                    queryStringParams[key].length === 1) ?
                    queryStringParams[key][0] : queryStringParams[key];
        });
        json.gateway = {
            params: event.pathParameters,
            query: queryStringParams,
            body,
            headers
        };
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
            // TODO: should also accept `header` to match express
            if (gateway$.headers) {
                res.headers = { ...res.headers, ...gateway$.headers };
            }
        }
        return res;
    }
    async function eventhandler(event, context) {
        let msg = seneca.util.Jsonic(event.seneca$.msg);
        let json = {
            event,
            ...msg,
        };
        let result = await gateway(json, { event, context });
        return result;
    }
    return {
        name: 'gateway-lambda',
        exports: {
            handler,
            eventhandler,
        }
    };
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