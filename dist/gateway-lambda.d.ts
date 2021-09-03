declare function gateway_lambda(this: any, options: any): {
    name: string;
    exports: {
        handler: (event: any, context: any) => Promise<any>;
    };
};
declare namespace gateway_lambda {
    var defaults: {};
}
export default gateway_lambda;
