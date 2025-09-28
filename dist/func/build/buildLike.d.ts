import { SelectStatementNode, LikeExpressionNode } from '../../ast';
export declare function buildLike(node: LikeExpressionNode, ast?: SelectStatementNode): {
    [x: string]: {
        $not: {
            $regex: string;
            $options: string;
        };
    };
    $expr?: undefined;
} | {
    [x: string]: {
        $regex: string;
        $options: string;
    };
    $expr?: undefined;
} | {
    $expr: any;
};
