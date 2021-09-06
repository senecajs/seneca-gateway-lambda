"use strict";
/* Copyright © 2021 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
function gateway_lambda(options) {
    const seneca = this;
    const gateway = seneca.export('gateway/handler');
    const parseJSON = seneca.export('gateway/parseJSON');
    seneca.act('sys:gateway,add:hook,hook:custom', {
        action: async function gateway_lambda_custom(custom, _json, ctx) {
            var _a, _b, _c, _d;
            const user = (_d = (_c = (_b = (_a = ctx.event) === null || _a === void 0 ? void 0 : _a.requestContext) === null || _b === void 0 ? void 0 : _b.authorizer) === null || _c === void 0 ? void 0 : _c.claims) === null || _d === void 0 ? void 0 : _d.user;
            if (user) {
                // TODO: need a plugin, seneca-principal, to make this uniform
                custom.principal = { user };
            }
        }
    });
    seneca.act('sys:gateway,add:hook,hook:action', {
        action: function gateway_lambda_before(_msg, ctx) {
            var _a, _b, _c;
            if (options.auth.cognito.required) {
                let seneca = this;
                let user = (_c = (_b = (_a = seneca === null || seneca === void 0 ? void 0 : seneca.fixedmeta) === null || _a === void 0 ? void 0 : _a.custom) === null || _b === void 0 ? void 0 : _b.principal) === null || _c === void 0 ? void 0 : _c.user;
                if (null == user) {
                    return { ok: false, why: 'no-auth' };
                }
            }
        }
    });
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
gateway_lambda.defaults = {
    auth: {
        cognito: {
            required: false
        }
    }
};
exports.default = gateway_lambda;
if ('undefined' !== typeof (module)) {
    module.exports = gateway_lambda;
}
//# sourceMappingURL=gateway-lambda.js.map