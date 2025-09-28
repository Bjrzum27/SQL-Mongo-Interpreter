import { UpdateStatementNode, SelectStatementNode } from './ast';
export interface CompiledUpdateResult {
    filter: Record<string, any>;
    updatePipeline: any[];
    limitOne: boolean;
    setStage: Record<string, any>;
    unsetFields: string[];
}
export interface UpdateScalarLookupInfo {
    alias: string;
    variables: Record<string, any>;
    subquery: SelectStatementNode;
}
export interface CompileUpdateOptions {
    scalarLookups?: UpdateScalarLookupInfo[];
}
export declare function compileUpdate(ast: UpdateStatementNode, options?: CompileUpdateOptions): CompiledUpdateResult;
export declare function createUpdateContext(ast: UpdateStatementNode): SelectStatementNode;
