export declare function withLet(expr: any, builder: (ref: string) => any): {
    $let: {
        vars: {
            [x: string]: any;
        };
        in: any;
    };
};
