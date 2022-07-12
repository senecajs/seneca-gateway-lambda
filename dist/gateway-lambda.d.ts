declare function gateway_lambda(this: any, options: any): {
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
        };
        headers: {
            'Access-Control-Allow-Origin': string;
            'Access-Control-Allow-Headers': string;
        };
    };
}
export default gateway_lambda;
