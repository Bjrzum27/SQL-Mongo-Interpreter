import { SelectStatementNode } from '../ast';
interface WhereSplitResult {
    baseMatch?: Record<string, any>;
    postMatch?: Record<string, any>;
}
export declare function splitWhereForPushdown(ast: SelectStatementNode): WhereSplitResult;
export {};
