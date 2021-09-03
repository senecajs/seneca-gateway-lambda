"use strict";
/* Copyright © 2021 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
function gateway_lambda(options) {
    const seneca = this;
    const gateway = seneca.export('gateway/handler');
    const parseJSON = seneca.export('gateway/parseJSON');
    async function handler(event, context) {
        const res = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*', // TODO: option!
            },
            body: '{}',
        };
        let body = event.body;
        let json = 'string' === typeof (body) ? parseJSON(body) : body;
        if (json.error$) {
            res.statusCode = 400;
            res.body = JSON.stringify(json);
        }
        else {
            let out = await gateway(json, { res, event, context });
            if (null != out) {
                res.body = JSON.stringify(out);
                if (out.error$) {
                    res.statusCode = 400;
                }
            }
        }
        return res;
    }
    return {
        name: 'gateway-lambda',
        exports: {
            handler
        }
    };
}
// Default options.
gateway_lambda.defaults = {};
exports.default = gateway_lambda;
if ('undefined' !== typeof (module)) {
    module.exports = gateway_lambda;
}
//# sourceMappingURL=gateway-lambda.js.map