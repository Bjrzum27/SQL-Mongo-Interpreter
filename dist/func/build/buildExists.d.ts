import { ExistsExpressionNode } from '../../ast';
export declare function buildExists(node: ExistsExpressionNode): {
    $expr: {
        $eq: (number | {
            $size: {
                $ifNull: (string | never[])[];
            };
        })[];
        $gt?: undefined;
    };
} | {
    $expr: {
        $gt: (number | {
            $size: {
                $ifNull: (string | never[])[];
            };
        })[];
        $eq?: undefined;
    };
} | {
    $expr?: undefined;
};
