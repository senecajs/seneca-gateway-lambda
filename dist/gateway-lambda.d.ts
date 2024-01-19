type WebHookSpec = {
    re: RegExp;
    params: string[];
    fixed: Record<string, any>;
};
type Options = {
    event: {
        msg: any;
    };
    auth: {
        cognito: {
            required: boolean;
        };
        token: {
            name: string;
        };
        cookie?: any;
    };
    headers: Record<string, string>;
    webhooks: WebHookSpec[];
};
export type GatewayLambdaOptions = Partial<Options>;
type Trigger = {
    record: any;
    event: any;
    context: any;
    gtag: string;
};
type Handler = {
    name: string;
    match: (trigger: Trigger) => boolean;
    process: (trigger: Trigger, gateway: Function) => any;
};
declare function gateway_lambda(this: any, options: Options): {
    name: string;
    exports: {
        handler: (event: any, context: any) => Promise<any>;
        eventhandler: (event: any, context: any) => Promise<any>;
        handlers: () => Handler[];
    };
};
export default gateway_lambda;
