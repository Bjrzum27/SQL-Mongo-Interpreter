import { SelectStatementNode, FunctionCallNode } from '../ast';
export declare function registerAggregateFunction(fn: FunctionCallNode, alias: string, accumulators: any, postProject: Record<string, any>, ast: SelectStatementNode): void;
