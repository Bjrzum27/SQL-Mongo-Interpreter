import { SelectStatementNode, InExpressionNode } from '../../ast';
export declare function buildIn(node: InExpressionNode, ast?: SelectStatementNode): {
    $expr: {
        $in: any[];
    } | {
        $not: {
            $in: any[];
        }[];
        $eq?: undefined;
    };
} | {
    $expr: {
        $eq: number[];
        $not?: undefined;
    };
} | {
    [x: string]: {
        $nin: any[];
    };
    $expr?: undefined;
} | {
    [x: string]: {
        $in: any[];
    };
    $expr?: undefined;
};
