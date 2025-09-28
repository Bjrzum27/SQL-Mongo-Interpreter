import { ExpressionNode, FunctionCallNode } from '../ast';
export declare function collectAggregateFunctions(expr: ExpressionNode | undefined, target: Map<string, FunctionCallNode>): void;
