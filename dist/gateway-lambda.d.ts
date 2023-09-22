type WebHookSpec = {
    re: RegExp;
    params: string[];
    fixed: Record<string, any>;
};
type GatewayLambdaOptions = {
    event?: {
        msg?: any;
    };
    auth?: {
        cognito: {
            required: boolean;
        };
        token: {
            name: string;
        };
        cookie?: any;
    };
    headers: Record<string, string>;
    webhooks?: WebHookSpec[];
};
declare function gateway_lambda(this: any, options: GatewayLambdaOptions): {
    name: string;
    exports: {
        handler: (event: any, context: any) => Promise<any>;
        eventhandler: (event: any, context: any) => Promise<any>;
    };
};
declare namespace gateway_lambda {
    var defaults: {
        event: {
            msg: string;
        };
        auth: {
            cognito: {
                required: boolean;
            };
            token: {
                name: string;
            };
            cookie: import("gubu").Node & {
                [name: string]: any;
            };
        };
        headers: import("gubu").Node & {
            [name: string]: any;
        };
        webhooks: {
            re: RegExpConstructor;
            params: StringConstructor[];
            fixed: {};
        }[];
    };
}
export default gateway_lambda;
