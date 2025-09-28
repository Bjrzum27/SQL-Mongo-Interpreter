import { SelectStatementNode } from './ast';
export interface CompileOptions {
    limit?: number;
}
export declare function compileToAggregation(ast: SelectStatementNode, options?: CompileOptions): any[];
