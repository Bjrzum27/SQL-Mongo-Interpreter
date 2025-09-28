import { SelectStatementNode, BetweenExpressionNode } from '../../ast';
export declare function buildBetween(node: BetweenExpressionNode, ast?: SelectStatementNode): {
    [x: string]: {
        $gte: any;
        $lte: any;
    };
} | {
    $or: ({
        [x: string]: {
            $lt: any;
        };
    } | {
        [x: string]: {
            $gt: any;
        };
    })[];
    $expr?: undefined;
} | {
    $expr: {
        $or: ({
            $lt: any[];
            $gt?: undefined;
        } | {
            $gt: any[];
            $lt?: undefined;
        })[];
        $and?: undefined;
    };
    $or?: undefined;
} | {
    $expr: {
        $and: ({
            $gte: any[];
            $lte?: undefined;
        } | {
            $lte: any[];
            $gte?: undefined;
        })[];
        $or?: undefined;
    };
    $or?: undefined;
};
