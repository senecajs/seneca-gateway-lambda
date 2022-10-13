declare type GatewayLambdaOptions = {
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
};
declare function gateway_lambda(this: any, options: GatewayLambdaOptions): {
    name: string;
    exports: {
        handler: (event: any, context: any) => Promise<any>;
    };
};
declare namespace gateway_lambda {
    var defaults: {
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
    };
}
export default gateway_lambda;
